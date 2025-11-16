from pydantic import BaseModel, Field, validator, root_validator
from typing import List, Optional

from .validation import (
    TITLE_RULES,
    ADMIN_PASSWORD_RULES,
    PERSON_NAME_RULES,
    PARTICIPANT_NAME_RULES,
    GAME_RULES,
    validate_title,
    validate_admin_password,
    validate_person_name,
    validate_participant_name,
)


class CreateGameRequest(BaseModel):
    title: str = Field(min_length=TITLE_RULES["minLength"], max_length=TITLE_RULES["maxLength"])
    admin_password: str = Field(
        min_length=ADMIN_PASSWORD_RULES["minLength"], max_length=ADMIN_PASSWORD_RULES["maxLength"]
    )
    person_ids: List[str] = Field(default_factory=list)
    participants: List[str] = Field(default_factory=list)

    @validator("title")
    def normalize_title(cls, v: str) -> str:
        return validate_title(v)

    @validator("admin_password")
    def normalize_admin_password(cls, v: str) -> str:
        return validate_admin_password(v)

    @validator("person_ids", pre=True, always=True)
    def validate_person_ids(cls, v: Optional[List[str]]) -> List[str]:
        if not v:
            return []
        if not isinstance(v, list):
            raise ValueError("person_ids must be a list")
        cleaned = []
        seen = set()
        for pid in v:
            if pid is None:
                continue
            pid_str = str(pid).strip()
            if not pid_str:
                continue
            if pid_str in seen:
                continue
            seen.add(pid_str)
            cleaned.append(pid_str)
        return cleaned

    @validator("participants", pre=True, always=True)
    def validate_participants(cls, v: Optional[List[str]]) -> List[str]:
        if not v:
            return []
        if not isinstance(v, list):
            raise ValueError("participants must be a list")
        cleaned: List[str] = []
        seen = set()
        for name in v:
            normalized = validate_participant_name(str(name))
            key = normalized.lower()
            if key in seen:
                raise ValueError("duplicate participant names")
            seen.add(key)
            cleaned.append(normalized)
        return cleaned

    @root_validator(skip_on_failure=True)
    def ensure_participants_source(cls, values):
        person_ids = values.get("person_ids") or []
        participants = values.get("participants") or []
        if not person_ids and not participants:
            raise ValueError("at least one participant source is required")
        total = len(person_ids) + len(participants)
        min_required = GAME_RULES["minParticipants"]
        if total < min_required:
            raise ValueError(f"at least {min_required} participants required")
        return values


class AddParticipantsRequest(BaseModel):
    participants: List[str] = Field(min_items=1)


class AddParticipantsByIdsRequest(BaseModel):
    person_ids: List[str] = Field(min_items=1)


class DrawRequest(BaseModel):
    force: bool = False


class GameStatusParticipant(BaseModel):
    id: str
    name: str
    token: str
    viewed: bool
    active: bool
    person_id: Optional[str] = None


class GameStatusResponse(BaseModel):
    game_id: str
    title: str
    created_at: str
    participants: List[GameStatusParticipant]
    any_revealed: bool
    assignment_version: int
    active: bool


class GameSummary(BaseModel):
    game_id: str
    title: str
    created_at: str
    any_revealed: bool
    active: bool
    participant_count: int


class UpdateGameRequest(BaseModel):
    title: str = Field(min_length=TITLE_RULES["minLength"], max_length=TITLE_RULES["maxLength"])

    @validator("title")
    def normalize_title(cls, v: str) -> str:
        return validate_title(v)


class UpdateParticipantRequest(BaseModel):
    name: str = Field(min_length=PARTICIPANT_NAME_RULES["minLength"], max_length=PARTICIPANT_NAME_RULES["maxLength"])

    @validator("name")
    def normalize_name(cls, v: str) -> str:
        return validate_participant_name(v)


class Person(BaseModel):
    id: str
    name: str
    active: bool


class CreatePeopleRequest(BaseModel):
    names: List[str] = Field(min_items=1)

    @validator("names")
    def clean_names(cls, v: List[str]) -> List[str]:
        names = []
        for name in v:
            trimmed = name.strip()
            if not trimmed:
                continue
            names.append(validate_person_name(trimmed))
        if not names:
            raise ValueError("at least one name is required")
        return names


class ParticipantPreviewResponse(BaseModel):
    name: str
    viewed: bool
    can_reveal: bool


class RevealResponse(BaseModel):
    assigned_to: str
