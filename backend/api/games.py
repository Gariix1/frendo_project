from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Header, Request

from ..models import (
  CreateGameRequest,
  DrawRequest,
  GameStatusResponse,
  GameSummary,
  UpdateGameRequest,
  AddParticipantsByIdsRequest,
  UpdateParticipantRequest,
  ParticipantPreviewResponse,
  RevealResponse,
  WishListItemRequest,
)
from ..services import games_service
from ..core.errors import app_error
from ..core.error_codes import ErrorCode

router = APIRouter(prefix="/api/games", tags=["games"])


@router.post("", status_code=201)
def create_game(request: Request, payload: CreateGameRequest) -> Dict[str, Any]:
  origin = request.headers.get("origin")
  return games_service.create_game(payload, origin)


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
def get_links(game_id: str, request: Request, x_admin_password: Optional[str] = Header(None)) -> List[Dict[str, str]]:
  origin = request.headers.get("origin")
  return games_service.get_links(game_id, x_admin_password, origin)


@router.post("/{game_id}/participants")
def add_participants_disabled(game_id: str, x_admin_password: Optional[str] = Header(None)) -> Dict[str, Any]:
  raise app_error(400, ErrorCode.FEATURE_DISABLED, "Adding by names is disabled; use /participants/by_ids")


@router.post("/{game_id}/participants/by_ids")
def add_participants_by_ids(game_id: str, payload: AddParticipantsByIdsRequest, x_admin_password: Optional[str] = Header(None)) -> Dict[str, Any]:
  return games_service.add_participants_by_ids(game_id, payload, x_admin_password)


@router.delete("/{game_id}/participants/{participant_id}", status_code=204)
def remove_participant(game_id: str, participant_id: str, x_admin_password: Optional[str] = Header(None)) -> None:
  games_service.remove_participant(game_id, participant_id, x_admin_password)


@router.post("/{game_id}/draw")
async def draw_assignments(game_id: str, request: Request, x_admin_password: Optional[str] = Header(None)) -> Dict[str, Any]:
  data: Dict[str, Any] = {}
  try:
    incoming = await request.json()
    if isinstance(incoming, dict):
      data = incoming
  except Exception:
    data = {}
  payload = DrawRequest(**data) if data else DrawRequest()
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


@router.get("/{game_id}/participants/{participant_id}/wishlist")
def get_participant_wishlist(game_id: str, participant_id: str, x_admin_password: Optional[str] = Header(None)) -> Dict[str, Any]:
  return games_service.get_wish_list_admin(game_id, participant_id, x_admin_password)


@router.post("/{game_id}/participants/{participant_id}/wishlist")
def add_participant_wishlist_item(game_id: str, participant_id: str, payload: WishListItemRequest, x_admin_password: Optional[str] = Header(None)) -> Dict[str, Any]:
  return games_service.add_wish_list_item_admin(game_id, participant_id, payload, x_admin_password)


@router.delete("/{game_id}/participants/{participant_id}/wishlist/{item_id}")
def remove_participant_wishlist_item(game_id: str, participant_id: str, item_id: str, x_admin_password: Optional[str] = Header(None)) -> Dict[str, Any]:
  return games_service.remove_wish_list_item_admin(game_id, participant_id, item_id, x_admin_password)


@router.get("/{game_id}/{token}/wishlist")
def get_wishlist_by_token(game_id: str, token: str) -> Dict[str, Any]:
  return games_service.get_wish_list_by_token(game_id, token)


@router.post("/{game_id}/{token}/wishlist")
def add_wishlist_item_by_token(game_id: str, token: str, payload: WishListItemRequest) -> Dict[str, Any]:
  return games_service.add_wish_list_item_by_token(game_id, token, payload)


@router.delete("/{game_id}/{token}/wishlist/{item_id}")
def remove_wishlist_item_by_token(game_id: str, token: str, item_id: str) -> Dict[str, Any]:
  return games_service.remove_wish_list_item_by_token(game_id, token, item_id)
