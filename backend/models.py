from pydantic import BaseModel, Field, validator
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
    # Exclusively from global directory
    person_ids: List[str] = Field(min_items=GAME_RULES["minParticipants"])

    @validator("title")
    def normalize_title(cls, v: str) -> str:
        return validate_title(v)

    @validator("admin_password")
    def normalize_admin_password(cls, v: str) -> str:
        return validate_admin_password(v)

    @validator("person_ids")
    def validate_person_ids(cls, v: List[str]) -> List[str]:
        min_required = GAME_RULES["minParticipants"]
        if len(set(v)) < min_required:
            raise ValueError(f"at least {min_required} unique person_ids required")
        return v


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
