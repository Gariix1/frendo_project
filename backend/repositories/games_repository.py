from typing import Callable, List, Optional, TypeVar

from ..storage import load_state, edit_state
from ..types import AppState, GameRecord, ParticipantRecord

T = TypeVar("T")


class GameRepository:
  """Read/write games via the shared AppState (keeps services storage-agnostic)."""
  def get_state(self) -> AppState:
    return load_state()

  def get_game(self, game_id: str) -> Optional[GameRecord]:
    return self.get_state()["games"].get(game_id)

  def list_games(self) -> List[GameRecord]:
    return list(self.get_state()["games"].values())

  def transact(self, mutator: Callable[[AppState], T]) -> T:
    with edit_state() as state:
      result = mutator(state)
      return result

  def list_participants(self, game_id: str) -> List[ParticipantRecord]:
    game = self.get_game(game_id)
    return list(game["participants"]) if game else []
