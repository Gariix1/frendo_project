from typing import Any, Dict, List, Optional

from ..models import (
  CreateGameRequest,
  GameStatusResponse,
  GameStatusParticipant,
  GameSummary,
  UpdateGameRequest,
  AddParticipantsByIdsRequest,
  UpdateParticipantRequest,
  ParticipantPreviewResponse,
  RevealResponse,
)
from ..storage import load_state, edit_state
from ..utils import (
  generate_game_id,
  generate_token,
  derangement_assignment,
  hash_password,
  get_share_base_url,
)
from ..validation import GAME_RULES
from ..core.errors import app_error
from ..core.security import require_admin
from ..core.time import now_iso


def _build_participant_record(idx: int, name: str, person_id: Optional[str] = None) -> Dict[str, Any]:
  return {
    "id": f"p{idx}",
    "person_id": person_id,
    "name": name,
    "token": generate_token(16),
    "assigned_to_participant_id": None,
    "viewed": False,
    "viewed_at": None,
    "active": True,
  }


def create_game(payload: CreateGameRequest) -> Dict[str, Any]:
  with edit_state() as state:
    gid = generate_game_id()
    while gid in state["games"]:
      gid = generate_game_id()
    created_at = now_iso()
    people = {p["id"]: p for p in state.get("people", []) if p.get("active", True)}
    selected = []
    for pid in payload.person_ids:
      person = people.get(pid)
      if not person:
        raise app_error(400, "person_not_found", f"Person id not found or inactive: {pid}")
      selected.append(person)
    manual_names = payload.participants or []
    if len(selected) + len(manual_names) < GAME_RULES["minParticipants"]:
      raise app_error(400, "game_min_participants", f"At least {GAME_RULES['minParticipants']} participants required")

    names_seen = set()
    participants: List[Dict[str, Any]] = []
    idx = 1
    for person in selected:
      name = person.get("name", "").strip()
      key = name.lower()
      if not name or key in names_seen:
        raise app_error(400, "duplicate_participant_names", "Duplicate or empty names among selected people")
      names_seen.add(key)
      participants.append(_build_participant_record(idx, name, person["id"]))
      idx += 1
    for provided_name in manual_names:
      normalized = provided_name.strip()
      if not normalized:
        raise app_error(400, "invalid_participant_name", "Participant names cannot be empty")
      key = normalized.lower()
      if key in names_seen:
        raise app_error(400, "duplicate_participant_names", "Duplicate names detected")
      names_seen.add(key)
      participants.append(_build_participant_record(idx, normalized))
      idx += 1

    state["games"][gid] = {
      "game_id": gid,
      "title": payload.title,
      "admin_password_hash": hash_password(payload.admin_password),
      "created_at": created_at,
      "updated_at": created_at,
      "active": True,
      "assignment_version": 0,
      "any_revealed": False,
      "participants": participants,
    }
    return {"game_id": gid, "share_base_url": get_share_base_url()}


def get_game_status(game_id: str, admin_password: Optional[str]) -> GameStatusResponse:
  state = load_state()
  game = require_admin(state, game_id, admin_password)
  return GameStatusResponse(
    game_id=game_id,
    title=game["title"],
    created_at=game["created_at"],
    participants=[
      GameStatusParticipant(
        id=p["id"],
        name=p["name"],
        token=p["token"],
        viewed=p["viewed"],
        active=p["active"],
        person_id=p.get("person_id"),
      )
      for p in game["participants"]
    ],
    any_revealed=game["any_revealed"],
    assignment_version=int(game.get("assignment_version", 0)),
    active=bool(game.get("active", True)),
  )


def list_games() -> List[GameSummary]:
  state = load_state()
  results = [
    GameSummary(
      game_id=gid,
      title=game.get("title", ""),
      created_at=game.get("created_at", ""),
      any_revealed=bool(game.get("any_revealed", False)),
      active=bool(game.get("active", True)),
      participant_count=len(game.get("participants", [])),
    )
    for gid, game in state.get("games", {}).items()
  ]
  results.sort(key=lambda g: g.created_at, reverse=True)
  return results


def update_game(game_id: str, payload: UpdateGameRequest, admin_password: Optional[str]) -> Dict[str, Any]:
  with edit_state() as state:
    game = require_admin(state, game_id, admin_password)
    game["title"] = payload.title
    game["updated_at"] = now_iso()
    return {"ok": True}


def delete_game(game_id: str, admin_password: Optional[str]) -> None:
  with edit_state() as state:
    _ = require_admin(state, game_id, admin_password)
    if game_id in state.get("games", {}):
      del state["games"][game_id]
      return
    raise app_error(404, "game_not_found", "Game not found")


def set_game_active(game_id: str, admin_password: Optional[str], active: bool) -> Dict[str, Any]:
  with edit_state() as state:
    game = require_admin(state, game_id, admin_password)
    game["active"] = active
    game["updated_at"] = now_iso()
    return {"ok": True}


def get_links(game_id: str, admin_password: Optional[str]) -> List[Dict[str, str]]:
  state = load_state()
  game = require_admin(state, game_id, admin_password)
  base = get_share_base_url().rstrip("/")
  return [
    {
      "participant_id": p["id"],
      "token": p["token"],
      "name": p["name"],
      "link": f"{base}/game/{game_id}/token/{p['token']}",
    }
    for p in game["participants"]
  ]


def add_participants_by_ids(game_id: str, payload: AddParticipantsByIdsRequest, admin_password: Optional[str]) -> Dict[str, Any]:
  with edit_state() as state:
    game = require_admin(state, game_id, admin_password)
    if game["any_revealed"]:
      raise app_error(409, "game_reveal_conflict", "Cannot add participants after reveal started")
    people = {p["id"]: p for p in state.get("people", []) if p.get("active", True)}
    existing_names = {p["name"].strip().lower() for p in game["participants"]}
    existing_person_ids = {p.get("person_id") for p in game["participants"] if p.get("person_id")}
    to_add = []
    for pid in payload.person_ids:
      person = people.get(pid)
      if not person:
        raise app_error(400, "person_not_found", f"Person id not found or inactive: {pid}")
      if pid in existing_person_ids:
        raise app_error(400, "person_already_in_game", f"Person already in game: {pid}")
      name = person.get("name", "").strip()
      key = name.lower()
      if not name or key in existing_names:
        raise app_error(400, "duplicate_participant_names", f"Duplicate name: {name}")
      existing_names.add(key)
      to_add.append(person)
    if not to_add:
      raise app_error(400, "no_participants_to_add", "No valid participants to add")
    next_idx = len(game["participants"]) + 1
    added = []
    for person in to_add:
      rec = _build_participant_record(next_idx, person["name"], person["id"])
      next_idx += 1
      game["participants"].append(rec)
      added.append({"id": rec["id"], "name": rec["name"], "person_id": rec["person_id"]})
    game["updated_at"] = now_iso()
    return {"added": added}


def remove_participant(game_id: str, participant_id: str, admin_password: Optional[str]) -> None:
  with edit_state() as state:
    game = require_admin(state, game_id, admin_password)
    if game["any_revealed"]:
      raise app_error(409, "game_reveal_conflict", "Cannot remove participants after reveal started")
    before = len(game["participants"])
    game["participants"] = [p for p in game["participants"] if p["id"] != participant_id]
    if len(game["participants"]) == before:
      raise app_error(404, "participant_not_found", "Participant not found")
    game["updated_at"] = now_iso()


def draw_assignments(game_id: str, payload: Any, admin_password: Optional[str]) -> Dict[str, Any]:
  with edit_state() as state:
    game = require_admin(state, game_id, admin_password)
    if not bool(game.get("active", True)):
      raise app_error(409, "game_inactive", "Game is inactive")
    force_flag = False
    try:
      if isinstance(payload, (bytes, bytearray)):
        payload = payload.decode("utf-8", errors="replace")
      if isinstance(payload, str):
        if payload.strip():
          import json as _json
          payload = _json.loads(payload)
        else:
          payload = None
      if isinstance(payload, dict):
        force_flag = bool(payload.get("force", False))
    except Exception:
      force_flag = False
    if game["any_revealed"] and not force_flag:
      raise app_error(409, "game_reveal_conflict", "Cannot redraw after reveal started (use force=true)")
    participants = [p for p in game["participants"] if p["active"]]
    if len(participants) < GAME_RULES["minParticipants"]:
      raise app_error(400, "game_min_participants", f"At least {GAME_RULES['minParticipants']} active participants required")
    mapping = derangement_assignment([p["id"] for p in participants])
    for p in game["participants"]:
      p["assigned_to_participant_id"] = mapping.get(p["id"]) if p["id"] in mapping else None
      p["viewed"] = False
      p["viewed_at"] = None
    game["assignment_version"] = int(game.get("assignment_version", 0)) + 1
    game["any_revealed"] = False
    game["updated_at"] = now_iso()
    return {"assignment_version": game["assignment_version"]}


def set_token_active(game_id: str, token: str, admin_password: Optional[str], active: bool) -> Dict[str, Any]:
  with edit_state() as state:
    game = require_admin(state, game_id, admin_password)
    if not bool(game.get("active", True)):
      raise app_error(409, "game_inactive", "Game is inactive")
    for p in game["participants"]:
      if p["token"] == token:
        p["active"] = active
        game["updated_at"] = now_iso()
        return {"ok": True}
    raise app_error(404, "token_not_found", "Token not found")


def _find_game_and_participant(state: Dict[str, Any], game_id: str, token: str) -> Optional[Dict[str, Any]]:
  game = state["games"].get(game_id)
  if not game:
    return None
  for p in game["participants"]:
    if p["token"] == token:
      return {"game": game, "participant": p}
  return None


def participant_preview(game_id: str, token: str) -> ParticipantPreviewResponse:
  state = load_state()
  pair = _find_game_and_participant(state, game_id, token)
  if not pair:
    raise app_error(404, "link_not_found", "Link not found")
  game = pair["game"]
  participant = pair["participant"]
  if not bool(game.get("active", True)) or not participant["active"]:
    raise app_error(404, "link_not_found", "Link not found")
  can_reveal = (participant["assigned_to_participant_id"] is not None) and (not participant["viewed"])
  return ParticipantPreviewResponse(name=participant["name"], viewed=participant["viewed"], can_reveal=can_reveal)


def reveal_assignment(game_id: str, token: str) -> RevealResponse:
  with edit_state() as state:
    pair = _find_game_and_participant(state, game_id, token)
    if not pair:
      raise app_error(404, "link_not_found", "Link not found")
    game = pair["game"]
    participant = pair["participant"]
    if not bool(game.get("active", True)) or not participant["active"]:
      raise app_error(404, "link_not_found", "Link not found")
    assigned_id = participant.get("assigned_to_participant_id")
    if not assigned_id:
      raise app_error(409, "assignment_not_ready", "Draw not performed yet")
    if participant["viewed"]:
      raise app_error(409, "assignment_already_viewed", "Already revealed")
    assigned_name = next((p["name"] for p in game["participants"] if p["id"] == assigned_id), None)
    if not assigned_name:
      raise app_error(500, "invalid_assignment_state", "Invalid assignment state")
    participant["viewed"] = True
    participant["viewed_at"] = now_iso()
    game["any_revealed"] = True
    game["updated_at"] = now_iso()
    return RevealResponse(assigned_to=assigned_name)


def rename_participant(game_id: str, participant_id: str, payload: UpdateParticipantRequest, admin_password: Optional[str]) -> Dict[str, Any]:
  with edit_state() as state:
    game = require_admin(state, game_id, admin_password)
    new_name = payload.name.strip()
    if not new_name:
      raise app_error(400, "name_required", "Name cannot be empty")
    for p in game["participants"]:
      if p["id"] != participant_id and p["name"].strip().lower() == new_name.lower():
        raise app_error(400, "duplicate_participant_names", "Duplicate name")
    target = next((p for p in game["participants"] if p["id"] == participant_id), None)
    if not target:
      raise app_error(404, "participant_not_found", "Participant not found")
    target["name"] = new_name
    game["updated_at"] = now_iso()
    return {"ok": True}
