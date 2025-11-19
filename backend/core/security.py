import os
from typing import Any, Dict, Optional

from .errors import app_error
from ..utils import verify_password


def require_admin(state: Dict[str, Any], game_id: str, admin_password: Optional[str]) -> Dict[str, Any]:
  """Ensure a valid admin password is provided for the given game."""
  if not admin_password:
    raise app_error(401, "missing_admin_password", "Missing admin password")
  game = state["games"].get(game_id)
  if not game:
    raise app_error(404, "game_not_found", "Game not found")
  if not verify_password(admin_password, game["admin_password_hash"]):
    raise app_error(401, "invalid_admin_password", "Invalid admin password")
  return game


def require_master(master_password: Optional[str]) -> None:
  """Enforce master admin password when configured."""
  expected = os.getenv("MASTER_ADMIN_PASSWORD")
  if expected in (None, ""):
    return
  if not master_password:
    raise app_error(401, "missing_master_password", "Missing master password")
  if master_password != expected:
    raise app_error(401, "invalid_master_password", "Invalid master password")
