from typing import Dict, List, Optional, TypedDict


class ParticipantRecord(TypedDict, total=False):
  id: str
  person_id: Optional[str]
  name: str
  token: str
  assigned_to_participant_id: Optional[str]
  viewed: bool
  viewed_at: Optional[str]
  active: bool


class GameRecord(TypedDict):
  game_id: str
  title: str
  admin_password_hash: str
  created_at: str
  updated_at: str
  active: bool
  assignment_version: int
  any_revealed: bool
  participants: List[ParticipantRecord]


class PersonRecord(TypedDict):
  id: str
  name: str
  active: bool


class AppState(TypedDict):
  games: Dict[str, GameRecord]
  people: List[PersonRecord]


class GameParticipantPair(TypedDict):
  game: GameRecord
  participant: ParticipantRecord
