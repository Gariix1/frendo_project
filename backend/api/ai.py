from fastapi import APIRouter

from ..models import GiftSuggestionRequest, GiftSuggestionResponse
from ..services import ai_gift_service


router = APIRouter(prefix="/api/games", tags=["ai"])


@router.post("/{game_id}/{token}/gift-suggestions", response_model=GiftSuggestionResponse)
def gift_suggestions(game_id: str, token: str, payload: GiftSuggestionRequest) -> GiftSuggestionResponse:
  return ai_gift_service.generate_gift_suggestions(game_id, token, payload)
