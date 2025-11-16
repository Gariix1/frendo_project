import os
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from fastapi import FastAPI, HTTPException, Header, Response, Request, Body
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from dotenv import load_dotenv

from .models import (
    CreateGameRequest,
    AddParticipantsRequest,
    AddParticipantsByIdsRequest,
    DrawRequest,
    GameStatusParticipant,
    GameStatusResponse,
    ParticipantPreviewResponse,
    RevealResponse,
    GameSummary,
    UpdateGameRequest,
    UpdateParticipantRequest,
    Person,
    CreatePeopleRequest,
)
from .storage import load_state, save_state
from .utils import (
    generate_game_id,
    generate_token,
    derangement_assignment,
    hash_password,
    verify_password,
    get_share_base_url,
)
from .validation import GAME_RULES


load_dotenv()  # Load .env variables (e.g., MASTER_ADMIN_PASSWORD, SHARE_BASE_URL)

app = FastAPI(title="Secret Friend API")

origins = os.getenv("FRONTEND_ORIGINS", "http://localhost:5173").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in origins if o.strip()],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)


class NoStoreCacheMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request, call_next):
        response = await call_next(request)
        # Prevent client/proxy caching to ensure single source of truth
        response.headers.setdefault("Cache-Control", "no-store")
        return response


app.add_middleware(NoStoreCacheMiddleware)


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def app_error(status: int, code: str, message: str) -> HTTPException:
    return HTTPException(status_code=status, detail={"code": code, "message": message})


def require_admin(state: Dict[str, Any], game_id: str, admin_password: Optional[str]) -> Dict[str, Any]:
    if not admin_password:
        raise app_error(401, "missing_admin_password", "Missing admin password")
    game = state["games"].get(game_id)
    if not game:
        raise app_error(404, "game_not_found", "Game not found")
    if not verify_password(admin_password, game["admin_password_hash"]):
        raise app_error(401, "invalid_admin_password", "Invalid admin password")
    return game


def require_master(master_password: Optional[str]) -> None:
    expected = os.getenv("MASTER_ADMIN_PASSWORD")
    if expected is None or expected == "":
        # No master password configured; allow without header
        return
    if not master_password:
        raise app_error(401, "missing_master_password", "Missing master password")
    if master_password != expected:
        raise app_error(401, "invalid_master_password", "Invalid master password")


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    # Friendlier error and make sure payload is JSON-serializable
    def _safe(obj):
        if isinstance(obj, (str, int, float, bool)) or obj is None:
            return obj
        if isinstance(obj, (list, tuple)):
            return [_safe(x) for x in obj]
        if isinstance(obj, dict):
            return {k: _safe(v) for k, v in obj.items()}
        if isinstance(obj, (bytes, bytearray)):
            try:
                return obj.decode("utf-8", errors="replace")
            except Exception:
                return "<bytes>"
        return str(obj)

    safe_errors = _safe(exc.errors())
    return JSONResponse(
        status_code=400,
        content={
            "code": "invalid_request_body",
            "message": "Invalid JSON body. Send a JSON object (application/json) - e.g.: { \"names\": [\"mateo\"] }",
            "errors": safe_errors,
        },
    )


@app.get("/api/admin/export")
def export_state(x_master_password: Optional[str] = Header(None)):
    # Only master can export full state
    require_master(x_master_password)
    state = load_state()
    return JSONResponse(
        content=state,
        headers={
            "Content-Disposition": "attachment; filename=backup.json",
            "Cache-Control": "no-store",
        },
    )


@app.post("/api/games", status_code=201)
def create_game(payload: CreateGameRequest) -> Dict[str, Any]:
    state = load_state()
    gid = generate_game_id()
    while gid in state["games"]:
        gid = generate_game_id()

    created_at = now_iso()
    participants: List[Dict[str, Any]] = []
    # Exclusively from global people directory
    people = {p["id"]: p for p in state.get("people", []) if p.get("active", True)}
    selected: List[Dict[str, Any]] = []
    for pid in payload.person_ids:
        if pid in people:
            selected.append(people[pid])
        else:
            raise app_error(400, "person_not_found", f"Person id not found or inactive: {pid}")
    min_required = GAME_RULES["minParticipants"]
    if len(selected) < min_required:
        raise app_error(400, "game_min_participants", f"At least {min_required} active people required")
    # ensure unique names within the game
    names_seen = set()
    idx = 1
    for person in selected:
        name = person.get("name", "").strip()
        if not name or name.lower() in names_seen:
            raise app_error(400, "duplicate_participant_names", "Duplicate or empty names among selected people")
        names_seen.add(name.lower())
        participants.append(
            {
                "id": f"p{idx}",
                "person_id": person["id"],
                "name": name,
                "token": generate_token(16),
                "assigned_to_participant_id": None,
                "viewed": False,
                "viewed_at": None,
                "active": True,
            }
        )
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
    save_state(state)
    return {"game_id": gid, "share_base_url": get_share_base_url()}


@app.get("/api/games/{game_id}")
def get_game_status(game_id: str, x_admin_password: Optional[str] = Header(None)) -> GameStatusResponse:
    state = load_state()
    game = require_admin(state, game_id, x_admin_password)
    parts = [
        GameStatusParticipant(
            id=p["id"], name=p["name"], token=p["token"], viewed=p["viewed"], active=p["active"], person_id=p.get("person_id")
        )
        for p in game["participants"]
    ]
    return GameStatusResponse(
        game_id=game_id,
        title=game["title"],
        created_at=game["created_at"],
        participants=parts,
        any_revealed=game["any_revealed"],
        assignment_version=int(game.get("assignment_version", 0)),
        active=bool(game.get("active", True)),
    )


@app.get("/api/games")
def list_games() -> List[GameSummary]:
    state = load_state()
    results: List[GameSummary] = []
    for gid, game in state.get("games", {}).items():
        results.append(
            GameSummary(
                game_id=gid,
                title=game.get("title", ""),
                created_at=game.get("created_at", ""),
                any_revealed=bool(game.get("any_revealed", False)),
                active=bool(game.get("active", True)),
                participant_count=len(game.get("participants", [])),
            )
        )
    # newest first
    results.sort(key=lambda g: g.created_at, reverse=True)
    return results


@app.patch("/api/games/{game_id}")
def update_game(game_id: str, payload: UpdateGameRequest, x_admin_password: Optional[str] = Header(None)) -> Dict[str, Any]:
    state = load_state()
    game = require_admin(state, game_id, x_admin_password)
    game["title"] = payload.title
    game["updated_at"] = now_iso()
    save_state(state)
    return {"ok": True}


@app.delete("/api/games/{game_id}", status_code=204)
def delete_game(game_id: str, x_admin_password: Optional[str] = Header(None)) -> Response:
    state = load_state()
    # Ensure admin auth and that game exists
    _ = require_admin(state, game_id, x_admin_password)
    if game_id in state.get("games", {}):
        del state["games"][game_id]
        save_state(state)
        return Response(status_code=204)
    raise app_error(404, "game_not_found", "Game not found")


@app.post("/api/games/{game_id}/deactivate_game")
def deactivate_game(game_id: str, x_admin_password: Optional[str] = Header(None)) -> Dict[str, Any]:
    state = load_state()
    game = require_admin(state, game_id, x_admin_password)
    game["active"] = False
    game["updated_at"] = now_iso()
    save_state(state)
    return {"ok": True}


@app.post("/api/games/{game_id}/reactivate_game")
def reactivate_game(game_id: str, x_admin_password: Optional[str] = Header(None)) -> Dict[str, Any]:
    state = load_state()
    game = require_admin(state, game_id, x_admin_password)
    game["active"] = True
    game["updated_at"] = now_iso()
    save_state(state)
    return {"ok": True}


@app.get("/api/games/{game_id}/links")
def get_links(game_id: str, x_admin_password: Optional[str] = Header(None)) -> List[Dict[str, str]]:
    state = load_state()
    game = require_admin(state, game_id, x_admin_password)
    base = get_share_base_url().rstrip("/")
    links = []
    for p in game["participants"]:
        url = f"{base}/game/{game_id}/token/{p['token']}"
        links.append(
            {
                "participant_id": p["id"],
                "token": p["token"],
                "name": p["name"],
                "link": url,
            }
        )
    return links


@app.post("/api/games/{game_id}/participants")
def add_participants(game_id: str, payload: AddParticipantsRequest, x_admin_password: Optional[str] = Header(None)) -> Dict[str, Any]:
    # Names-based addition disabled by design
    raise app_error(400, "feature_disabled", "Adding by names is disabled; use /participants/by_ids")


@app.post("/api/games/{game_id}/participants/by_ids")
def add_participants_by_ids(game_id: str, payload: AddParticipantsByIdsRequest, x_admin_password: Optional[str] = Header(None)) -> Dict[str, Any]:
    state = load_state()
    game = require_admin(state, game_id, x_admin_password)
    if game["any_revealed"]:
        raise app_error(409, "game_reveal_conflict", "Cannot add participants after reveal started")
    people = {p["id"]: p for p in state.get("people", []) if p.get("active", True)}
    existing_names = {p["name"].strip().lower() for p in game["participants"]}
    existing_person_ids = {p.get("person_id") for p in game["participants"] if p.get("person_id")}
    to_add_records = []
    for pid in payload.person_ids:
        person = people.get(pid)
        if not person:
            raise app_error(400, "person_not_found", f"Person id not found or inactive: {pid}")
        if pid in existing_person_ids:
            raise app_error(400, "person_already_in_game", f"Person already in game: {pid}")
        name = person.get("name", "").strip()
        if not name or name.lower() in existing_names:
            raise app_error(400, "duplicate_participant_names", f"Duplicate name: {name}")
        to_add_records.append(person)
        existing_names.add(name.lower())
    if not to_add_records:
        raise app_error(400, "no_participants_to_add", "No valid participants to add")
    next_idx = len(game["participants"]) + 1
    added = []
    for person in to_add_records:
        pid = f"p{next_idx}"
        next_idx += 1
        rec = {
            "id": pid,
            "person_id": person["id"],
            "name": person["name"],
            "token": generate_token(16),
            "assigned_to_participant_id": None,
            "viewed": False,
            "viewed_at": None,
            "active": True,
        }
        game["participants"].append(rec)
        added.append({"id": pid, "name": rec["name"], "person_id": rec["person_id"]})
    game["updated_at"] = now_iso()
    save_state(state)
    return {"added": added}


@app.delete("/api/games/{game_id}/participants/{participant_id}", status_code=204)
def remove_participant(game_id: str, participant_id: str, x_admin_password: Optional[str] = Header(None)) -> Response:
    state = load_state()
    game = require_admin(state, game_id, x_admin_password)
    if game["any_revealed"]:
        raise app_error(409, "game_reveal_conflict", "Cannot remove participants after reveal started")
    before = len(game["participants"])
    game["participants"] = [p for p in game["participants"] if p["id"] != participant_id]
    if len(game["participants"]) == before:
        raise app_error(404, "participant_not_found", "Participant not found")
    game["updated_at"] = now_iso()
    save_state(state)
    return Response(status_code=204)


@app.post("/api/games/{game_id}/draw")
def draw_assignments(game_id: str, payload: Any = Body(None), x_admin_password: Optional[str] = Header(None)) -> Dict[str, Any]:
    state = load_state()
    game = require_admin(state, game_id, x_admin_password)
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
    ids = [p["id"] for p in participants]
    mapping = derangement_assignment(ids)
    # apply mapping
    for p in game["participants"]:
        p["assigned_to_participant_id"] = mapping.get(p["id"]) if p["id"] in mapping else None
        p["viewed"] = False
        p["viewed_at"] = None
    game["assignment_version"] = int(game.get("assignment_version", 0)) + 1
    game["any_revealed"] = False
    game["updated_at"] = now_iso()
    save_state(state)
    return {"assignment_version": game["assignment_version"]}


@app.post("/api/games/{game_id}/{token}/deactivate")
def deactivate_token(game_id: str, token: str, x_admin_password: Optional[str] = Header(None)) -> Dict[str, Any]:
    state = load_state()
    game = require_admin(state, game_id, x_admin_password)
    if not bool(game.get("active", True)):
        raise app_error(409, "game_inactive", "Game is inactive")
    for p in game["participants"]:
        if p["token"] == token:
            p["active"] = False
            game["updated_at"] = now_iso()
            save_state(state)
            return {"ok": True}
    raise app_error(404, "token_not_found", "Token not found")


@app.post("/api/games/{game_id}/{token}/reactivate")
def reactivate_token(game_id: str, token: str, x_admin_password: Optional[str] = Header(None)) -> Dict[str, Any]:
    state = load_state()
    game = require_admin(state, game_id, x_admin_password)
    if not bool(game.get("active", True)):
        raise app_error(409, "game_inactive", "Game is inactive")
    for p in game["participants"]:
        if p["token"] == token:
            p["active"] = True
            game["updated_at"] = now_iso()
            save_state(state)
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


@app.get("/api/games/{game_id}/{token}")
def participant_preview(game_id: str, token: str) -> ParticipantPreviewResponse:
    state = load_state()
    pair = _find_game_and_participant(state, game_id, token)
    if not pair:
        raise app_error(404, "link_not_found", "Link not found")
    game = pair["game"]
    p = pair["participant"]
    if not bool(game.get("active", True)):
        raise app_error(404, "link_not_found", "Link not found")
    if not p["active"]:
        raise app_error(404, "link_not_found", "Link not found")
    can_reveal = (p["assigned_to_participant_id"] is not None) and (not p["viewed"])
    return ParticipantPreviewResponse(name=p["name"], viewed=p["viewed"], can_reveal=can_reveal)


@app.post("/api/games/{game_id}/{token}/reveal")
def reveal_assignment(game_id: str, token: str) -> RevealResponse:
    state = load_state()
    pair = _find_game_and_participant(state, game_id, token)
    if not pair:
        raise app_error(404, "link_not_found", "Link not found")
    game = pair["game"]
    p = pair["participant"]
    if not bool(game.get("active", True)):
        raise app_error(404, "link_not_found", "Link not found")
    if not p["active"]:
        raise app_error(404, "link_not_found", "Link not found")
    assigned_id = p.get("assigned_to_participant_id")
    if not assigned_id:
        raise app_error(409, "assignment_not_ready", "Draw not performed yet")
    if p["viewed"]:
        raise app_error(409, "assignment_already_viewed", "Already revealed")
    # find assigned participant name
    assigned_name: Optional[str] = None
    for q in game["participants"]:
        if q["id"] == assigned_id:
            assigned_name = q["name"]
            break
    if not assigned_name:
        raise app_error(500, "invalid_assignment_state", "Invalid assignment state")
    p["viewed"] = True
    p["viewed_at"] = now_iso()
    game["any_revealed"] = True
    game["updated_at"] = now_iso()
    save_state(state)
    return RevealResponse(assigned_to=assigned_name)


# People directory (global participants)

@app.get("/api/people")
def list_people() -> List[Person]:
    state = load_state()
    people = [Person(**p) for p in state.get("people", [])]
    # sort by name
    people.sort(key=lambda p: p.name.lower())
    return people


@app.post("/api/people")
def add_people(payload: Any = Body(...), x_master_password: Optional[str] = Header(None)) -> Dict[str, Any]:
    require_master(x_master_password)
    state = load_state()
    # Be tolerant to text/plain payloads where body is a JSON string
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
    except Exception as e:
        raise app_error(400, "invalid_people_request", str(e))
    existing = {p["name"].strip().lower(): p for p in state.get("people", [])}
    added = []
    next_idx = len(state.get("people", [])) + 1
    for name in model.names:
        key = name.strip().lower()
        if not key:
            continue
        if key in existing:
            # ensure active
            existing[key]["active"] = True
            continue
        person = {"id": f"u{next_idx}", "name": name.strip(), "active": True}
        next_idx += 1
        state["people"].append(person)
        added.append(person)
    save_state(state)
    return {"added": added}


@app.patch("/api/people/{person_id}")
def rename_person(person_id: str, payload: UpdateParticipantRequest, x_master_password: Optional[str] = Header(None)) -> Dict[str, Any]:
    require_master(x_master_password)
    state = load_state()
    people = state.get("people", [])
    new_name = payload.name.strip()
    if not new_name:
        raise app_error(400, "name_required", "Name cannot be empty")
    # unique name
    for p in people:
        if p["id"] != person_id and p["name"].strip().lower() == new_name.lower():
            raise app_error(400, "name_duplicate", "Duplicate name")
    target = None
    for p in people:
        if p["id"] == person_id:
            target = p
            break
    if not target:
        raise app_error(404, "person_not_found", "Person not found")
    target["name"] = new_name
    save_state(state)
    return {"ok": True}


@app.post("/api/people/{person_id}/deactivate")
def deactivate_person(person_id: str, x_master_password: Optional[str] = Header(None)) -> Dict[str, Any]:
    require_master(x_master_password)
    state = load_state()
    for p in state.get("people", []):
        if p["id"] == person_id:
            p["active"] = False
            save_state(state)
            return {"ok": True}
    raise app_error(404, "person_not_found", "Person not found")


@app.post("/api/people/{person_id}/reactivate")
def reactivate_person(person_id: str, x_master_password: Optional[str] = Header(None)) -> Dict[str, Any]:
    require_master(x_master_password)
    state = load_state()
    for p in state.get("people", []):
        if p["id"] == person_id:
            p["active"] = True
            save_state(state)
            return {"ok": True}
    raise app_error(404, "person_not_found", "Person not found")


@app.patch("/api/games/{game_id}/participants/{participant_id}")
def rename_participant(game_id: str, participant_id: str, payload: UpdateParticipantRequest, x_admin_password: Optional[str] = Header(None)) -> Dict[str, Any]:
    state = load_state()
    game = require_admin(state, game_id, x_admin_password)
    new_name = payload.name.strip()
    if not new_name:
        raise app_error(400, "name_required", "Name cannot be empty")
    # unique across game (case-insensitive)
    for p in game["participants"]:
        if p["id"] != participant_id and p["name"].strip().lower() == new_name.lower():
            raise app_error(400, "duplicate_participant_names", "Duplicate name")
    target = None
    for p in game["participants"]:
        if p["id"] == participant_id:
            target = p
            break
    if not target:
        raise app_error(404, "participant_not_found", "Participant not found")
    target["name"] = new_name
    game["updated_at"] = now_iso()
    save_state(state)
    return {"ok": True}
