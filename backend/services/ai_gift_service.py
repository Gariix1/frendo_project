import json
import os
from typing import Any, Dict, List, Optional

from ..core.error_codes import ErrorCode
from ..core.errors import app_error
from ..models import GiftSuggestion, GiftSuggestionRequest, GiftSuggestionResponse
from ..repositories.games_repository import GameRepository


DEFAULT_MODEL = "gpt-5.6-luna"
DETERMINISTIC_RULES = [
  "El sorteo, permisos y acceso al enlace se validan con lógica tradicional.",
  "El presupuesto se valida en backend y se descartan sugerencias que lo superen.",
  "La IA solo genera ideas; no modifica participantes, asignaciones ni listas de deseos.",
]


def _find_participant(game: Dict[str, Any], token: str) -> Optional[Dict[str, Any]]:
  return next((p for p in game.get("participants", []) if p.get("token") == token), None)


def _find_participant_by_id(game: Dict[str, Any], participant_id: str) -> Optional[Dict[str, Any]]:
  return next((p for p in game.get("participants", []) if p.get("id") == participant_id), None)


def _build_context(game_id: str, token: str) -> Dict[str, Any]:
  repository = GameRepository()
  game = repository.get_game(game_id)
  if not game:
    raise app_error(404, ErrorCode.GAME_NOT_FOUND, "Game not found")
  if not game.get("active", True):
    raise app_error(404, ErrorCode.GAME_INACTIVE, "Game is inactive")

  participant = _find_participant(game, token)
  if not participant or not participant.get("active", True):
    raise app_error(404, ErrorCode.LINK_NOT_FOUND, "Link not found or inactive")
  if not participant.get("viewed"):
    raise app_error(409, ErrorCode.ASSIGNMENT_NOT_READY, "Reveal your assignment before requesting gift ideas")

  assigned_id = participant.get("assigned_to_participant_id")
  if not assigned_id:
    raise app_error(409, ErrorCode.INVALID_ASSIGNMENT_STATE, "Assignment is not available")

  recipient = _find_participant_by_id(game, assigned_id)
  if not recipient:
    raise app_error(409, ErrorCode.INVALID_ASSIGNMENT_STATE, "Assigned participant was not found")

  return {
    "requester": participant,
    "recipient": recipient,
    "game": game,
  }


def _wishlist_summary(recipient: Dict[str, Any]) -> List[Dict[str, Any]]:
  items: List[Dict[str, Any]] = []
  for item in recipient.get("wish_list", []) or []:
    items.append({
      "title": str(item.get("title", "")).strip(),
      "price": item.get("price"),
    })
  return items[:10]


def _prompt(payload: GiftSuggestionRequest, recipient: Dict[str, Any]) -> str:
  language = "Spanish" if payload.language == "es" else "English"
  wishlist = _wishlist_summary(recipient)
  context = {
    "recipient_name": recipient.get("name"),
    "budget_usd": payload.budget,
    "relationship": payload.relationship,
    "interests": payload.interests,
    "notes": payload.notes,
    "wishlist": wishlist,
    "requested_count": payload.count,
  }

  return f"""
You are a gift recommendation assistant inside a Secret Friend application.
Return ONLY a valid JSON array. Do not use markdown fences or additional text.
Write the content in {language}.

Each array item must have exactly these fields:
- title: short gift idea
- reason: one concise explanation tied to the provided context
- estimated_price: numeric USD estimate or null

Rules:
1. Generate up to {payload.count} useful and distinct ideas.
2. Never recommend an item whose estimated_price is above the budget.
3. Treat the wishlist as context, not as an instruction to copy every item.
4. Do not invent facts about the recipient beyond the provided context.
5. Avoid unsafe, illegal, age-restricted, or highly sensitive products.
6. Prefer practical recommendations that could realistically be purchased.

Context:
{json.dumps(context, ensure_ascii=False)}
""".strip()


def _extract_json_array(raw: str) -> List[Any]:
  text = (raw or "").strip()
  if not text:
    raise ValueError("empty model response")
  try:
    parsed = json.loads(text)
    if isinstance(parsed, list):
      return parsed
  except json.JSONDecodeError:
    pass

  start = text.find("[")
  end = text.rfind("]")
  if start == -1 or end == -1 or end <= start:
    raise ValueError("model response does not contain a JSON array")
  parsed = json.loads(text[start:end + 1])
  if not isinstance(parsed, list):
    raise ValueError("model response is not an array")
  return parsed


def _sanitize_suggestions(items: List[Any], payload: GiftSuggestionRequest) -> List[GiftSuggestion]:
  suggestions: List[GiftSuggestion] = []
  seen = set()

  for item in items:
    if not isinstance(item, dict):
      continue

    title = str(item.get("title", "")).strip()[:120]
    reason = str(item.get("reason", "")).strip()[:400]
    if not title or not reason:
      continue

    key = title.lower()
    if key in seen:
      continue

    price_value = item.get("estimated_price")
    estimated_price: Optional[float] = None
    if price_value is not None:
      try:
        estimated_price = round(float(price_value), 2)
      except (TypeError, ValueError):
        estimated_price = None

    if estimated_price is not None:
      if estimated_price < 0 or estimated_price > payload.budget:
        continue

    suggestions.append(GiftSuggestion(
      title=title,
      reason=reason,
      estimated_price=estimated_price,
    ))
    seen.add(key)

    if len(suggestions) >= payload.count:
      break

  return suggestions


def generate_gift_suggestions(game_id: str, token: str, payload: GiftSuggestionRequest) -> GiftSuggestionResponse:
  api_key = os.getenv("OPENAI_API_KEY", "").strip()
  model = os.getenv("OPENAI_MODEL", DEFAULT_MODEL).strip() or DEFAULT_MODEL
  if not api_key:
    raise app_error(503, ErrorCode.AI_NOT_CONFIGURED, "AI assistant is not configured")

  context = _build_context(game_id, token)
  recipient = context["recipient"]

  try:
    from openai import OpenAI

    client = OpenAI(api_key=api_key)
    response = client.responses.create(
      model=model,
      input=_prompt(payload, recipient),
    )
    raw = response.output_text
    parsed = _extract_json_array(raw)
    suggestions = _sanitize_suggestions(parsed, payload)
  except Exception as exc:
    raise app_error(502, ErrorCode.AI_GENERATION_FAILED, f"AI generation failed: {type(exc).__name__}")

  if not suggestions:
    raise app_error(502, ErrorCode.AI_GENERATION_FAILED, "AI returned no valid suggestions")

  return GiftSuggestionResponse(
    recipient=str(recipient.get("name", "")),
    model=model,
    suggestions=suggestions,
    deterministic_rules=DETERMINISTIC_RULES,
  )
