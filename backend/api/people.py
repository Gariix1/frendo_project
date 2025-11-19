from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Header

from ..models import Person, UpdateParticipantRequest
from ..services import people_service

router = APIRouter(prefix="/api/people", tags=["people"])


@router.get("")
def list_people() -> List[Person]:
  return people_service.list_people()


@router.post("")
def add_people(payload: Any, x_master_password: Optional[str] = Header(None)) -> Dict[str, Any]:
  return people_service.add_people(payload, x_master_password)


@router.patch("/{person_id}")
def rename_person(person_id: str, payload: UpdateParticipantRequest, x_master_password: Optional[str] = Header(None)) -> Dict[str, Any]:
  return people_service.rename_person(person_id, payload, x_master_password)


@router.post("/{person_id}/deactivate")
def deactivate_person(person_id: str, x_master_password: Optional[str] = Header(None)) -> Dict[str, Any]:
  return people_service.set_person_active(person_id, x_master_password, False)


@router.post("/{person_id}/reactivate")
def reactivate_person(person_id: str, x_master_password: Optional[str] = Header(None)) -> Dict[str, Any]:
  return people_service.set_person_active(person_id, x_master_password, True)
