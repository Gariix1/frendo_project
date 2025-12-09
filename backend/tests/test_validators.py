import unittest

from fastapi import HTTPException  # type: ignore
from backend.services import validators
from backend.validation import GAME_RULES
from backend.core import errors as core_errors

core_errors.HTTPException = HTTPException


class ValidatorTests(unittest.TestCase):
  def test_ensure_min_participants_rejects_small_number(self):
    min_required = GAME_RULES["minParticipants"]
    with self.assertRaises(HTTPException) as ctx:
      validators.ensure_min_participants(min_required - 1)
    self.assertEqual(ctx.exception.status_code, 400)

  def test_normalize_and_check_name_detects_duplicates(self):
    seen = set()
    normalized = validators.normalize_and_check_name("  Ana  ", seen)
    self.assertEqual(normalized, "Ana")
    with self.assertRaises(HTTPException):
      validators.normalize_and_check_name("ana", seen)


if __name__ == "__main__":
  unittest.main()
