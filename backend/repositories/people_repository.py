from typing import Callable, List, TypeVar

from ..storage import load_state, edit_state
from ..app_types import AppState, PersonRecord

T = TypeVar("T")


class PeopleRepository:
  """Thin wrapper around AppState to keep people operations centralized."""
  def get_state(self) -> AppState:
    return load_state()

  def list_people(self) -> List[PersonRecord]:
    return list(self.get_state().get("people", []))

  def transact(self, mutator: Callable[[AppState], T]) -> T:
    with edit_state() as state:
      result = mutator(state)
      return result
