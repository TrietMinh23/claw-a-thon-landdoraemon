# backend/routers/v1_workshops.py
from fastapi import APIRouter, HTTPException
import mock_data

router = APIRouter(prefix="/api/v1")


@router.get("/workshops")
def list_workshops():
    return mock_data.WORKSHOPS


@router.get("/workshops/{workshop_id}")
def get_workshop(workshop_id: str):
    for w in mock_data.WORKSHOPS:
        if w["id"] == workshop_id:
            return w
    raise HTTPException(404, "Workshop not found")


@router.get("/workshops/{workshop_id}/attendees")
def get_attendees(workshop_id: str):
    # POC: return all attendees regardless of workshop_id
    return mock_data.ATTENDEES
