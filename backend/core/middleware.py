from starlette.middleware.base import BaseHTTPMiddleware


class NoStoreCacheMiddleware(BaseHTTPMiddleware):
  """Avoid caching API responses to guarantee real-time state."""

  async def dispatch(self, request, call_next):
    response = await call_next(request)
    response.headers.setdefault("Cache-Control", "no-store")
    return response
