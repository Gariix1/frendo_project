from typing import Dict, List, Optional, Set

from ..models import (
  CreateGameRequest,
  DrawRequest,
  GameStatusResponse,
  GameStatusParticipant,
  GameSummary,
  UpdateGameRequest,
  AddParticipantsByIdsRequest,
  UpdateParticipantRequest,
  ParticipantPreviewResponse,
  RevealResponse,
)
from ..repositories.games_repository import GameRepository
from ..utils import (
  generate_game_id,
  generate_token,
  derangement_assignment,
  hash_password,
  get_share_base_url,
)
from ..core.errors import app_error
from ..core.error_codes import ErrorCode
from ..core.security import require_admin
from ..core.time import now_iso
from ..types import AppState, ParticipantRecord, GameParticipantPair
from .validators import ensure_min_participants, normalize_and_check_name, ensure_game_exists

game_repo = GameRepository()  # shared repo instance for all handlers


def _build_participant_record(idx: int, name: str, person_id: Optional[str] = None) -> ParticipantRecord:
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


def create_game(payload: CreateGameRequest) -> Dict[str, str]:
  def _mutate(state: AppState) -> Dict[str, str]:
    gid = generate_game_id()
    while gid in state["games"]:
      gid = generate_game_id()
    created_at = now_iso()
    people = {p["id"]: p for p in state.get("people", []) if p.get("active", True)}
    selected = []
    for pid in payload.person_ids:
      person = people.get(pid)
      if not person:
        raise app_error(400, ErrorCode.PERSON_NOT_FOUND, f"Person id not found or inactive: {pid}")
      selected.append(person)
    manual_names = payload.participants or []
    ensure_min_participants(len(selected) + len(manual_names))

    names_seen: Set[str] = set()
    participants: List[ParticipantRecord] = []
    idx = 1
    for person in selected:
      name = normalize_and_check_name(person.get("name", ""), names_seen)
      participants.append(_build_participant_record(idx, name, person["id"]))
      idx += 1
    for provided_name in manual_names:
      normalized = normalize_and_check_name(provided_name, names_seen)
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
  return game_repo.transact(_mutate)


def get_game_status(game_id: str, admin_password: Optional[str]) -> GameStatusResponse:
  state = game_repo.get_state()
  game = ensure_game_exists(state["games"].get(game_id))
  require_admin(state, game_id, admin_password)
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
  games = game_repo.list_games()
  results = [
    GameSummary(
      game_id=game.get("game_id", ""),
      title=game.get("title", ""),
      created_at=game.get("created_at", ""),
      any_revealed=bool(game.get("any_revealed", False)),
      active=bool(game.get("active", True)),
      participant_count=len(game.get("participants", [])),
    )
    for game in games
  ]
  results.sort(key=lambda g: g.created_at, reverse=True)
  return results


def update_game(game_id: str, payload: UpdateGameRequest, admin_password: Optional[str]) -> Dict[str, bool]:
  def _mutate(state: AppState) -> Dict[str, bool]:
    game = require_admin(state, game_id, admin_password)
    game["title"] = payload.title
    game["updated_at"] = now_iso()
    return {"ok": True}
  return game_repo.transact(_mutate)


def delete_game(game_id: str, admin_password: Optional[str]) -> None:
  def _mutate(state: AppState) -> None:
    _ = require_admin(state, game_id, admin_password)
    if game_id in state.get("games", {}):
      del state["games"][game_id]
      return
    raise app_error(404, ErrorCode.GAME_NOT_FOUND, "Game not found")
  game_repo.transact(_mutate)


def set_game_active(game_id: str, admin_password: Optional[str], active: bool) -> Dict[str, bool]:
  def _mutate(state: AppState) -> Dict[str, bool]:
    game = require_admin(state, game_id, admin_password)
    game["active"] = active
    game["updated_at"] = now_iso()
    return {"ok": True}
  return game_repo.transact(_mutate)


def get_links(game_id: str, admin_password: Optional[str]) -> List[Dict[str, str]]:
  state = game_repo.get_state()
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


def add_participants_by_ids(game_id: str, payload: AddParticipantsByIdsRequest, admin_password: Optional[str]) -> Dict[str, List[Dict[str, str]]]:
  def _mutate(state: AppState) -> Dict[str, List[Dict[str, str]]]:
    game = require_admin(state, game_id, admin_password)
    if game["any_revealed"]:
      raise app_error(409, ErrorCode.GAME_REVEAL_CONFLICT, "Cannot add participants after reveal started")
    people = {p["id"]: p for p in state.get("people", []) if p.get("active", True)}
    existing_names = {p["name"].strip().lower() for p in game["participants"]}
    existing_person_ids = {p.get("person_id") for p in game["participants"] if p.get("person_id")}
    to_add = []
    for pid in payload.person_ids:
      person = people.get(pid)
      if not person:
        raise app_error(400, ErrorCode.PERSON_NOT_FOUND, f"Person id not found or inactive: {pid}")
      if pid in existing_person_ids:
        raise app_error(400, ErrorCode.PERSON_ALREADY_IN_GAME, f"Person already in game: {pid}")
      normalized_name = normalize_and_check_name(person.get("name", ""), existing_names)
      to_add.append({**person, "name": normalized_name})
    if not to_add:
      raise app_error(400, ErrorCode.NO_PARTICIPANTS_TO_ADD, "No valid participants to add")
    next_idx = len(game["participants"]) + 1
    added = []
    for person in to_add:
      rec = _build_participant_record(next_idx, person["name"], person["id"])
      next_idx += 1
      game["participants"].append(rec)
      added.append({"id": rec["id"], "name": rec["name"], "person_id": rec["person_id"]})
    game["updated_at"] = now_iso()
    return {"added": added}
  return game_repo.transact(_mutate)


def remove_participant(game_id: str, participant_id: str, admin_password: Optional[str]) -> None:
  def _mutate(state: AppState) -> None:
    game = require_admin(state, game_id, admin_password)
    if game["any_revealed"]:
      raise app_error(409, ErrorCode.GAME_REVEAL_CONFLICT, "Cannot remove participants after reveal started")
    before = len(game["participants"])
    game["participants"] = [p for p in game["participants"] if p["id"] != participant_id]
    if len(game["participants"]) == before:
      raise app_error(404, ErrorCode.PARTICIPANT_NOT_FOUND, "Participant not found")
    game["updated_at"] = now_iso()
  game_repo.transact(_mutate)


def draw_assignments(game_id: str, payload: DrawRequest, admin_password: Optional[str]) -> Dict[str, int]:
  def _mutate(state: AppState) -> Dict[str, int]:
    game = require_admin(state, game_id, admin_password)
    if not bool(game.get("active", True)):
      raise app_error(409, ErrorCode.GAME_INACTIVE, "Game is inactive")
    force_flag = bool(payload.force)
    if game["any_revealed"] and not force_flag:
      raise app_error(409, ErrorCode.GAME_REVEAL_CONFLICT, "Cannot redraw after reveal started (use force=true)")
    participants = [p for p in game["participants"] if p["active"]]
    ensure_min_participants(len(participants))
    mapping = derangement_assignment([p["id"] for p in participants])
    for p in game["participants"]:
      p["assigned_to_participant_id"] = mapping.get(p["id"]) if p["id"] in mapping else None
      p["viewed"] = False
      p["viewed_at"] = None
    game["assignment_version"] = int(game.get("assignment_version", 0)) + 1
    game["any_revealed"] = False
    game["updated_at"] = now_iso()
    return {"assignment_version": game["assignment_version"]}
  return game_repo.transact(_mutate)


def set_token_active(game_id: str, token: str, admin_password: Optional[str], active: bool) -> Dict[str, bool]:
  def _mutate(state: AppState) -> Dict[str, bool]:
    game = require_admin(state, game_id, admin_password)
    if not bool(game.get("active", True)):
      raise app_error(409, ErrorCode.GAME_INACTIVE, "Game is inactive")
    for p in game["participants"]:
      if p["token"] == token:
        p["active"] = active
        game["updated_at"] = now_iso()
        return {"ok": True}
    raise app_error(404, ErrorCode.TOKEN_NOT_FOUND, "Token not found")
  return game_repo.transact(_mutate)


def _find_game_and_participant(state: AppState, game_id: str, token: str) -> Optional[GameParticipantPair]:
  game = state["games"].get(game_id)
  if not game:
    return None
  for p in game["participants"]:
    if p["token"] == token:
      return {"game": game, "participant": p}
  return None


def participant_preview(game_id: str, token: str) -> ParticipantPreviewResponse:
  state = game_repo.get_state()
  pair = _find_game_and_participant(state, game_id, token)
  if not pair:
    raise app_error(404, ErrorCode.LINK_NOT_FOUND, "Link not found")
  game = pair["game"]
  participant = pair["participant"]
  if not bool(game.get("active", True)) or not participant["active"]:
    raise app_error(404, ErrorCode.LINK_NOT_FOUND, "Link not found")
  can_reveal = (participant["assigned_to_participant_id"] is not None) and (not participant["viewed"])
  return ParticipantPreviewResponse(name=participant["name"], viewed=participant["viewed"], can_reveal=can_reveal)


def reveal_assignment(game_id: str, token: str) -> RevealResponse:
  def _mutate(state: AppState) -> RevealResponse:
    pair = _find_game_and_participant(state, game_id, token)
    if not pair:
      raise app_error(404, ErrorCode.LINK_NOT_FOUND, "Link not found")
    game = pair["game"]
    participant = pair["participant"]
    if not bool(game.get("active", True)) or not participant["active"]:
      raise app_error(404, ErrorCode.LINK_NOT_FOUND, "Link not found")
    assigned_id = participant.get("assigned_to_participant_id")
    if not assigned_id:
      raise app_error(409, ErrorCode.ASSIGNMENT_NOT_READY, "Draw not performed yet")
    if participant["viewed"]:
      raise app_error(409, ErrorCode.ASSIGNMENT_ALREADY_VIEWED, "Already revealed")
    assigned_name = next((p["name"] for p in game["participants"] if p["id"] == assigned_id), None)
    if not assigned_name:
      raise app_error(500, ErrorCode.INVALID_ASSIGNMENT_STATE, "Invalid assignment state")
    participant["viewed"] = True
    participant["viewed_at"] = now_iso()
    game["any_revealed"] = True
    game["updated_at"] = now_iso()
    return RevealResponse(assigned_to=assigned_name)
  return game_repo.transact(_mutate)


def rename_participant(game_id: str, participant_id: str, payload: UpdateParticipantRequest, admin_password: Optional[str]) -> Dict[str, bool]:
  def _mutate(state: AppState) -> Dict[str, bool]:
    game = require_admin(state, game_id, admin_password)
    new_name = payload.name.strip()
    if not new_name:
      raise app_error(400, ErrorCode.NAME_REQUIRED, "Name cannot be empty")
    for p in game["participants"]:
      if p["id"] != participant_id and p["name"].strip().lower() == new_name.lower():
        raise app_error(400, ErrorCode.DUPLICATE_PARTICIPANT_NAMES, "Duplicate name")
    target = next((p for p in game["participants"] if p["id"] == participant_id), None)
    if not target:
      raise app_error(404, ErrorCode.PARTICIPANT_NOT_FOUND, "Participant not found")
    target["name"] = new_name
    game["updated_at"] = now_iso()
    return {"ok": True}
  return game_repo.transact(_mutate)
