from datetime import datetime, timezone


def now_iso() -> str:
  """UTC ISO string used across persisted records."""
  return datetime.now(timezone.utc).isoformat()
