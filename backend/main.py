import os
from typing import Any

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from dotenv import load_dotenv

from .api import admin, games, people
from .core.middleware import NoStoreCacheMiddleware


load_dotenv()

# App wiring follows this order:
#  1. load routers (backend/api) -> 2. services -> 3. repositories -> 4. storage/validators
# This keeps FastAPI concerns separated from business logic (SOLID-friendly).
app = FastAPI(title="Secret Friend API")

origins = os.getenv("FRONTEND_ORIGINS", "http://localhost:5173").split(",")
app.add_middleware(
  CORSMiddleware,
  allow_origins=[o.strip() for o in origins if o.strip()],
  allow_credentials=True,
  allow_methods=["*"],
  allow_headers=["*"],
)
app.add_middleware(NoStoreCacheMiddleware)

app.include_router(games.router)
app.include_router(people.router)
app.include_router(admin.router)


def _safe(obj: Any):
  if isinstance(obj, (str, int, float, bool)) or obj is None:
    return obj
  if isinstance(obj, (list, tuple)):
    return [_safe(x) for x in obj]
  if isinstance(obj, dict):
    return {k: _safe(v) for k, v in obj.items()}
  if isinstance(obj, (bytes, bytearray)):
    try:
      return obj.decode("utf-8", errors="replace")
    except Exception:
      return "<bytes>"
  return str(obj)


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(_: Request, exc: RequestValidationError):
  safe_errors = _safe(exc.errors())
  return JSONResponse(
    status_code=400,
    content={
      "code": "invalid_request_body",
      "message": 'Invalid JSON body. Send a JSON object (application/json) - e.g.: { "names": ["mateo"] }',
      "errors": safe_errors,
    },
  )
