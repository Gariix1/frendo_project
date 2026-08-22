import os
import tempfile
import unittest

from backend import storage
from backend.models import CreateGameRequest, DrawRequest, GiftSuggestionRequest
from backend.services import games_service
from backend.services.ai_gift_service import (
  _authorize_context,
  _extract_json_array,
  _sanitize_suggestions,
  create_ai_session,
)


class GiftAssistantParsingTests(unittest.TestCase):
  def test_extract_json_array_accepts_plain_json(self):
    result = _extract_json_array('[{"title":"Coffee"}]')
    self.assertEqual(result[0]["title"], "Coffee")

  def test_extract_json_array_recovers_wrapped_text(self):
    result = _extract_json_array('Result: [{"title":"Book"}] done')
    self.assertEqual(result[0]["title"], "Book")

  def test_sanitize_deduplicates_and_enforces_budget(self):
    payload = GiftSuggestionRequest(
      session_token="a" * 24,
      budget=30,
      interests=[],
      relationship=None,
      notes=None,
      count=5,
      language="es",
    )
    result = _sanitize_suggestions([
      {"title": "Coffee kit", "reason": "Matches the interest", "estimated_price": 22},
      {"title": "Coffee kit", "reason": "Duplicate", "estimated_price": 20},
      {"title": "Expensive headphones", "reason": "Too expensive", "estimated_price": 80},
      {"title": "Book", "reason": "Fits the budget", "estimated_price": 15},
    ], payload)

    self.assertEqual([item.title for item in result], ["Coffee kit", "Book"])
    self.assertTrue(all((item.estimated_price or 0) <= 30 for item in result))


class GiftAssistantSessionTests(unittest.TestCase):
  def setUp(self):
    self.temp_dir = tempfile.TemporaryDirectory()
    storage.DATA_DIR = self.temp_dir.name
    storage.JSON_FALLBACK = os.path.join(self.temp_dir.name, "data.json")
    storage.DB_PATH = os.path.join(self.temp_dir.name, "data.sqlite")
    os.makedirs(storage.DATA_DIR, exist_ok=True)
    with storage.edit_state() as state:
      state["games"] = {}
      state["people"] = []

    result = games_service.create_game(CreateGameRequest(
      title="AI demo",
      admin_password="admin123",
      participants=["Ana", "Luis", "Eva"],
      person_ids=[],
    ))
    self.game_id = result["game_id"]
    games_service.draw_assignments(self.game_id, DrawRequest(force=False), "admin123")
    status = games_service.get_game_status(self.game_id, "admin123")
    self.token = status.participants[0].token

  def tearDown(self):
    self.temp_dir.cleanup()

  def test_session_created_before_reveal_authorizes_after_reveal(self):
    session = create_ai_session(self.game_id, self.token)
    self.assertTrue(session.session_token)
    games_service.reveal_assignment(self.game_id, self.token)

    context = _authorize_context(self.game_id, self.token, session.session_token)
    self.assertTrue(context["recipient"]["name"])

  def test_old_session_is_invalid_after_redraw(self):
    session = create_ai_session(self.game_id, self.token)
    games_service.reveal_assignment(self.game_id, self.token)
    games_service.draw_assignments(self.game_id, DrawRequest(force=True), "admin123")
    games_service.reveal_assignment(self.game_id, self.token)

    with self.assertRaises(Exception):
      _authorize_context(self.game_id, self.token, session.session_token)


if __name__ == "__main__":
  unittest.main()
