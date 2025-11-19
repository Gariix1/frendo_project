from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Header, Body

from ..models import (
  CreateGameRequest,
  GameStatusResponse,
  GameSummary,
  UpdateGameRequest,
  AddParticipantsByIdsRequest,
  UpdateParticipantRequest,
  ParticipantPreviewResponse,
  RevealResponse,
)
from ..services import games_service
from ..core.errors import app_error

router = APIRouter(prefix="/api/games", tags=["games"])


@router.post("", status_code=201)
def create_game(payload: CreateGameRequest) -> Dict[str, Any]:
  return games_service.create_game(payload)


@router.get("/{game_id}")
def get_game_status(game_id: str, x_admin_password: Optional[str] = Header(None)) -> GameStatusResponse:
  return games_service.get_game_status(game_id, x_admin_password)


@router.get("")
def list_games() -> List[GameSummary]:
  return games_service.list_games()


@router.patch("/{game_id}")
def update_game(game_id: str, payload: UpdateGameRequest, x_admin_password: Optional[str] = Header(None)) -> Dict[str, Any]:
  return games_service.update_game(game_id, payload, x_admin_password)


@router.delete("/{game_id}", status_code=204)
def delete_game(game_id: str, x_admin_password: Optional[str] = Header(None)) -> None:
  games_service.delete_game(game_id, x_admin_password)


@router.post("/{game_id}/deactivate_game")
def deactivate_game(game_id: str, x_admin_password: Optional[str] = Header(None)) -> Dict[str, Any]:
  return games_service.set_game_active(game_id, x_admin_password, False)


@router.post("/{game_id}/reactivate_game")
def reactivate_game(game_id: str, x_admin_password: Optional[str] = Header(None)) -> Dict[str, Any]:
  return games_service.set_game_active(game_id, x_admin_password, True)


@router.get("/{game_id}/links")
def get_links(game_id: str, x_admin_password: Optional[str] = Header(None)) -> List[Dict[str, str]]:
  return games_service.get_links(game_id, x_admin_password)


@router.post("/{game_id}/participants")
def add_participants_disabled(game_id: str, x_admin_password: Optional[str] = Header(None)) -> Dict[str, Any]:
  raise app_error(400, "feature_disabled", "Adding by names is disabled; use /participants/by_ids")


@router.post("/{game_id}/participants/by_ids")
def add_participants_by_ids(game_id: str, payload: AddParticipantsByIdsRequest, x_admin_password: Optional[str] = Header(None)) -> Dict[str, Any]:
  return games_service.add_participants_by_ids(game_id, payload, x_admin_password)


@router.delete("/{game_id}/participants/{participant_id}", status_code=204)
def remove_participant(game_id: str, participant_id: str, x_admin_password: Optional[str] = Header(None)) -> None:
  games_service.remove_participant(game_id, participant_id, x_admin_password)


@router.post("/{game_id}/draw")
def draw_assignments(game_id: str, payload: Any = Body(None), x_admin_password: Optional[str] = Header(None)) -> Dict[str, Any]:
  return games_service.draw_assignments(game_id, payload, x_admin_password)


@router.post("/{game_id}/{token}/deactivate")
def deactivate_token(game_id: str, token: str, x_admin_password: Optional[str] = Header(None)) -> Dict[str, Any]:
  return games_service.set_token_active(game_id, token, x_admin_password, False)


@router.post("/{game_id}/{token}/reactivate")
def reactivate_token(game_id: str, token: str, x_admin_password: Optional[str] = Header(None)) -> Dict[str, Any]:
  return games_service.set_token_active(game_id, token, x_admin_password, True)


@router.get("/{game_id}/{token}")
def participant_preview(game_id: str, token: str) -> ParticipantPreviewResponse:
  return games_service.participant_preview(game_id, token)


@router.post("/{game_id}/{token}/reveal")
def reveal_assignment(game_id: str, token: str) -> RevealResponse:
  return games_service.reveal_assignment(game_id, token)


@router.patch("/{game_id}/participants/{participant_id}")
def rename_participant(game_id: str, participant_id: str, payload: UpdateParticipantRequest, x_admin_password: Optional[str] = Header(None)) -> Dict[str, Any]:
  return games_service.rename_participant(game_id, participant_id, payload, x_admin_password)
