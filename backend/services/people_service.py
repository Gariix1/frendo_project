from typing import Any, Dict, List, Optional, Set

from ..models import Person, CreatePeopleRequest, UpdateParticipantRequest
from ..core.security import require_master
from ..core.errors import app_error
from ..core.error_codes import ErrorCode
from ..repositories.people_repository import PeopleRepository
from .validators import normalize_person_name

people_repo = PeopleRepository()


def list_people() -> List[Person]:
  state = people_repo.get_state()
  people = [Person(**p) for p in state.get("people", [])]
  people.sort(key=lambda p: p.name.lower())
  return people


def add_people(payload: Any, master_password: Optional[str]) -> Dict[str, Any]:
  require_master(master_password)
  if isinstance(payload, (bytes, bytearray)):
    try:
      payload = payload.decode("utf-8", errors="replace")
    except Exception:
      raise app_error(400, ErrorCode.INVALID_PAYLOAD_BYTES, "Invalid payload bytes")
  if isinstance(payload, str):
    import json as _json
    try:
      payload = _json.loads(payload)
    except Exception:
      raise app_error(400, ErrorCode.INVALID_REQUEST_BODY, 'Invalid JSON body. Expected { "names": ["Ana"] }')
  if not isinstance(payload, dict):
    raise app_error(400, ErrorCode.INVALID_REQUEST_BODY, "Invalid JSON body. Expected an object with a 'names' array")
  try:
    model = CreatePeopleRequest(**payload)
  except Exception as exc:
    raise app_error(400, ErrorCode.INVALID_PEOPLE_REQUEST, str(exc))

  def _mutate(state):
    existing = {p["name"].strip().lower(): p for p in state.get("people", [])}
    new_seen: Set[str] = set()
    added = []
    next_idx = len(state.get("people", [])) + 1
    for name in model.names:
      normalized = normalize_person_name(name)
      key = normalized.lower()
      if key in existing:
        existing[key]["active"] = True
        continue
      if key in new_seen:
        raise app_error(400, ErrorCode.NAME_DUPLICATE, "Duplicate name")
      new_seen.add(key)
      person = {"id": f"u{next_idx}", "name": normalized, "active": True}
      next_idx += 1
      state.setdefault("people", []).append(person)
      added.append(person)
    return {"added": added}
  return people_repo.transact(_mutate)


def rename_person(person_id: str, payload: UpdateParticipantRequest, master_password: Optional[str]) -> Dict[str, Any]:
  require_master(master_password)
  def _mutate(state):
    people = state.get("people", [])
    new_name = normalize_person_name(payload.name)
    for person in people:
      if person["id"] != person_id and person["name"].strip().lower() == new_name.lower():
        raise app_error(400, ErrorCode.NAME_DUPLICATE, "Duplicate name")
    target = next((p for p in people if p["id"] == person_id), None)
    if not target:
      raise app_error(404, ErrorCode.PERSON_NOT_FOUND, "Person not found")
    target["name"] = new_name
    return {"ok": True}
  return people_repo.transact(_mutate)


def set_person_active(person_id: str, master_password: Optional[str], active: bool) -> Dict[str, Any]:
  require_master(master_password)
  def _mutate(state):
    for p in state.get("people", []):
      if p["id"] == person_id:
        p["active"] = active
        return {"ok": True}
    raise app_error(404, ErrorCode.PERSON_NOT_FOUND, "Person not found")
  return people_repo.transact(_mutate)
