from typing import Union

from fastapi import HTTPException

from .error_codes import ErrorCode


CodeType = Union[str, ErrorCode]


def app_error(status: int, code: CodeType, message: str) -> HTTPException:
  """Factory for consistent API error payloads."""
  return HTTPException(status_code=status, detail={"code": str(code), "message": message})
