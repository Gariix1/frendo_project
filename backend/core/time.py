from datetime import datetime, timedelta, timezone
from typing import Optional


def now_iso() -> str:
  """UTC ISO string used across persisted records."""
  return datetime.now(timezone.utc).isoformat()


def future_iso(minutes: int) -> str:
  """UTC ISO timestamp a fixed number of minutes in the future."""
  return (datetime.now(timezone.utc) + timedelta(minutes=minutes)).isoformat()


def is_future_iso(value: Optional[str]) -> bool:
  """Return True only for a valid timestamp that is still in the future."""
  if not value:
    return False
  try:
    parsed = datetime.fromisoformat(value)
    if parsed.tzinfo is None:
      parsed = parsed.replace(tzinfo=timezone.utc)
    return parsed > datetime.now(timezone.utc)
  except (TypeError, ValueError):
    return False
