from typing import Optional

from fastapi import APIRouter, Header

from ..services import admin_service
from ..core.security import require_master

router = APIRouter(prefix="/api/admin", tags=["admin"])


@router.get("/export")
def export_state(x_master_password: Optional[str] = Header(None)):
  require_master(x_master_password)
  return admin_service.export_state()
