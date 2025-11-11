from pydantic import BaseModel, Field, validator, root_validator
from typing import List, Optional


class CreateGameRequest(BaseModel):
    title: str = Field(min_length=1, max_length=100)
    admin_password: str = Field(min_length=3, max_length=128)
    # Exclusively from global directory
    person_ids: List[str] = Field(min_items=3)

    @validator("person_ids")
    def validate_person_ids(cls, v: List[str]) -> List[str]:
        if len(set(v)) < 3:
            raise ValueError("at least 3 unique person_ids required")
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
    title: str = Field(min_length=1, max_length=100)


class UpdateParticipantRequest(BaseModel):
    name: str = Field(min_length=1, max_length=100)


class Person(BaseModel):
    id: str
    name: str
    active: bool


class CreatePeopleRequest(BaseModel):
    names: List[str] = Field(min_items=1)

    @validator("names")
    def clean_names(cls, v: List[str]) -> List[str]:
        names = [n.strip() for n in v if n.strip()]
        if not names:
            raise ValueError("at least one name is required")
        return names


class ParticipantPreviewResponse(BaseModel):
    name: str
    viewed: bool
    can_reveal: bool


class RevealResponse(BaseModel):
    assigned_to: str
