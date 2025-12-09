from fastapi.responses import JSONResponse

from ..storage import load_state


def export_state() -> JSONResponse:
  state = load_state()
  return JSONResponse(
    content=state,
    headers={
      "Content-Disposition": "attachment; filename=backup.json",
      "Cache-Control": "no-store",
    },
  )
