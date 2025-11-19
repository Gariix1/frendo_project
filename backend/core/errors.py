from fastapi import HTTPException


def app_error(status: int, code: str, message: str) -> HTTPException:
  """Factory for consistent API error payloads."""
  return HTTPException(status_code=status, detail={"code": code, "message": message})
