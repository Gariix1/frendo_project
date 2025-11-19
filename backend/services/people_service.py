from typing import Any, Dict, List, Optional

from ..models import Person, CreatePeopleRequest, UpdateParticipantRequest
from ..storage import load_state, edit_state
from ..core.security import require_master
from ..core.errors import app_error


def list_people() -> List[Person]:
  state = load_state()
  people = [Person(**p) for p in state.get("people", [])]
  people.sort(key=lambda p: p.name.lower())
  return people


def add_people(payload: Any, master_password: Optional[str]) -> Dict[str, Any]:
  require_master(master_password)
  if isinstance(payload, (bytes, bytearray)):
    try:
      payload = payload.decode("utf-8", errors="replace")
    except Exception:
      raise app_error(400, "invalid_payload_bytes", "Invalid payload bytes")
  if isinstance(payload, str):
    import json as _json
    try:
      payload = _json.loads(payload)
    except Exception:
      raise app_error(400, "invalid_request_body", 'Invalid JSON body. Expected { "names": ["Ana"] }')
  if not isinstance(payload, dict):
    raise app_error(400, "invalid_request_body", "Invalid JSON body. Expected an object with a 'names' array")
  try:
    model = CreatePeopleRequest(**payload)
  except Exception as exc:
    raise app_error(400, "invalid_people_request", str(exc))

  with edit_state() as state:
    existing = {p["name"].strip().lower(): p for p in state.get("people", [])}
    added = []
    next_idx = len(state.get("people", [])) + 1
    for name in model.names:
      key = name.strip().lower()
      if not key:
        continue
      if key in existing:
        existing[key]["active"] = True
        continue
      person = {"id": f"u{next_idx}", "name": name.strip(), "active": True}
      next_idx += 1
      state.setdefault("people", []).append(person)
      added.append(person)
    return {"added": added}


def rename_person(person_id: str, payload: UpdateParticipantRequest, master_password: Optional[str]) -> Dict[str, Any]:
  require_master(master_password)
  with edit_state() as state:
    people = state.get("people", [])
    new_name = payload.name.strip()
    if not new_name:
      raise app_error(400, "name_required", "Name cannot be empty")
    for person in people:
      if person["id"] != person_id and person["name"].strip().lower() == new_name.lower():
        raise app_error(400, "name_duplicate", "Duplicate name")
    target = next((p for p in people if p["id"] == person_id), None)
    if not target:
      raise app_error(404, "person_not_found", "Person not found")
    target["name"] = new_name
    return {"ok": True}


def set_person_active(person_id: str, master_password: Optional[str], active: bool) -> Dict[str, Any]:
  require_master(master_password)
  with edit_state() as state:
    for p in state.get("people", []):
      if p["id"] == person_id:
        p["active"] = active
        return {"ok": True}
    raise app_error(404, "person_not_found", "Person not found")
