import os
from typing import Optional

from .errors import app_error
from .error_codes import ErrorCode
from ..utils import verify_password
from ..types import AppState, GameRecord


def require_admin(state: AppState, game_id: str, admin_password: Optional[str]) -> GameRecord:
  """Ensure a valid admin password is provided for the given game."""
  if not admin_password:
    raise app_error(401, ErrorCode.MISSING_ADMIN_PASSWORD, "Missing admin password")
  game = state["games"].get(game_id)
  if not game:
    raise app_error(404, ErrorCode.GAME_NOT_FOUND, "Game not found")
  if not verify_password(admin_password, game["admin_password_hash"]):
    raise app_error(401, ErrorCode.INVALID_ADMIN_PASSWORD, "Invalid admin password")
  return game


def require_master(master_password: Optional[str]) -> None:
  """Enforce master admin password when configured."""
  expected = os.getenv("MASTER_ADMIN_PASSWORD")
  if expected in (None, ""):
    return
  if not master_password:
    raise app_error(401, ErrorCode.MISSING_MASTER_PASSWORD, "Missing master password")
  if master_password != expected:
    raise app_error(401, ErrorCode.INVALID_MASTER_PASSWORD, "Invalid master password")
