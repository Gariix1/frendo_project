"""Test suite package for backend services."""

import sys
import types

if "pydantic" not in sys.modules:
  pydantic = types.ModuleType("pydantic")  # type: ignore

  class BaseModel:  # type: ignore
    def __init__(self, **data):
      for key, value in data.items():
        setattr(self, key, value)

  def Field(*args, **kwargs):
    return kwargs.get("default", None)

  def validator(*args, **kwargs):
    def decorator(func):
      return func
    return decorator

  def root_validator(*args, **kwargs):
    def decorator(func):
      return func
    return decorator

  pydantic.BaseModel = BaseModel
  pydantic.Field = Field
  pydantic.validator = validator
  pydantic.root_validator = root_validator
  sys.modules["pydantic"] = pydantic

if "fastapi" not in sys.modules:
  fastapi = types.ModuleType("fastapi")  # type: ignore

  class HTTPException(Exception):  # type: ignore
    def __init__(self, status_code: int, detail=None):
      super().__init__(detail)
      self.status_code = status_code
      self.detail = detail

  fastapi.HTTPException = HTTPException
  sys.modules["fastapi"] = fastapi

  responses = types.ModuleType("fastapi.responses")  # type: ignore

  class JSONResponse:
    def __init__(self, content=None, headers=None, status_code=200):
      self.content = content
      self.headers = headers or {}
      self.status_code = status_code

  responses.JSONResponse = JSONResponse
  sys.modules["fastapi.responses"] = responses
