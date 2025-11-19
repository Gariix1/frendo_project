from typing import Optional, Set

from ..core.errors import app_error
from ..core.error_codes import ErrorCode
from ..validation import GAME_RULES, validate_participant_name, validate_person_name


def ensure_min_participants(count: int) -> None:
  min_required = GAME_RULES["minParticipants"]
  if count < min_required:
    raise app_error(400, ErrorCode.GAME_MIN_PARTICIPANTS, f"At least {min_required} participants required")


def normalize_and_check_name(raw_name: str, seen: Set[str]) -> str:
  normalized = validate_participant_name(raw_name)
  key = normalized.lower()
  if key in seen:
    raise app_error(400, ErrorCode.DUPLICATE_PARTICIPANT_NAMES, "Duplicate participant names")
  seen.add(key)
  return normalized


def ensure_game_exists(game: Optional[dict]) -> dict:
  if not game:
    raise app_error(404, ErrorCode.GAME_NOT_FOUND, "Game not found")
  return game


def normalize_person_name(raw_name: str) -> str:
  normalized = validate_person_name(raw_name)
  if not normalized:
    raise app_error(400, ErrorCode.NAME_REQUIRED, "Name cannot be empty")
  return normalized


def normalize_unique_person_name(raw_name: str, seen: Set[str]) -> str:
  normalized = normalize_person_name(raw_name)
  key = normalized.lower()
  if key in seen:
    raise app_error(400, ErrorCode.NAME_DUPLICATE, "Duplicate name")
  seen.add(key)
  return normalized
