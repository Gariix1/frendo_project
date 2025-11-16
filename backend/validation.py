import json
from pathlib import Path
from typing import Any, Dict


def _load_rules() -> Dict[str, Any]:
    shared_path = Path(__file__).resolve().parents[1] / "shared" / "validationRules.json"
    with open(shared_path, "r", encoding="utf-8") as f:
        return json.load(f)


RULES = _load_rules()

TITLE_RULES: Dict[str, int] = RULES["title"]
ADMIN_PASSWORD_RULES: Dict[str, int] = RULES["adminPassword"]
PERSON_NAME_RULES: Dict[str, int] = RULES["personName"]
PARTICIPANT_NAME_RULES: Dict[str, int] = RULES["participantName"]
GAME_RULES: Dict[str, int] = RULES["game"]


def _normalize(value: str) -> str:
    return " ".join(value.split()).strip()


def _enforce_length(value: str, rules: Dict[str, int], field: str) -> str:
    normalized = _normalize(value)
    min_len = int(rules.get("minLength", 0) or 0)
    max_len = int(rules.get("maxLength", 0) or 0)
    if min_len and len(normalized) < min_len:
        raise ValueError(f"{field} must be at least {min_len} characters")
    if max_len and len(normalized) > max_len:
        raise ValueError(f"{field} must be at most {max_len} characters")
    return normalized


def validate_title(value: str) -> str:
    return _enforce_length(value, TITLE_RULES, "title")


def validate_admin_password(value: str) -> str:
    normalized = value.strip()
    min_len = int(ADMIN_PASSWORD_RULES.get("minLength", 0) or 0)
    max_len = int(ADMIN_PASSWORD_RULES.get("maxLength", 0) or 0)
    if min_len and len(normalized) < min_len:
        raise ValueError(f"admin password must be at least {min_len} characters")
    if max_len and len(normalized) > max_len:
        raise ValueError(f"admin password must be at most {max_len} characters")
    return normalized


def validate_person_name(value: str) -> str:
    return _enforce_length(value, PERSON_NAME_RULES, "name")


def validate_participant_name(value: str) -> str:
    return _enforce_length(value, PARTICIPANT_NAME_RULES, "participant name")

