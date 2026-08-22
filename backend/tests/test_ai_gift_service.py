import unittest

from backend.models import GiftSuggestionRequest
from backend.services.ai_gift_service import _extract_json_array, _sanitize_suggestions


class GiftAssistantParsingTests(unittest.TestCase):
  def test_extract_json_array_accepts_plain_json(self):
    result = _extract_json_array('[{"title":"Coffee"}]')
    self.assertEqual(result[0]["title"], "Coffee")

  def test_extract_json_array_recovers_wrapped_text(self):
    result = _extract_json_array('Result: [{"title":"Book"}] done')
    self.assertEqual(result[0]["title"], "Book")

  def test_sanitize_deduplicates_and_enforces_budget(self):
    payload = GiftSuggestionRequest(
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


if __name__ == "__main__":
  unittest.main()
