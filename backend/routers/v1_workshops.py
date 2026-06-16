# backend/routers/v1_workshops.py
from datetime import datetime
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import mock_data
import services.graph_service as graph_service
from graph.exceptions import AuthError, GraphAPIError

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
    return mock_data.ATTENDEES


class InviteRequest(BaseModel):
    attendees: list[str]
    subject: str
    start: datetime
    end: datetime
    location: str = ""
    body_html: str = ""


@router.post("/workshops/{workshop_id}/invite")
async def invite_workshop(workshop_id: str, req: InviteRequest):
    try:
        client = graph_service.get_client()
    except AuthError:
        raise HTTPException(503, "Graph not authenticated. Call /api/v1/graph/auth/start")
    try:
        event = await client.create_event(
            subject=req.subject,
            start=req.start,
            end=req.end,
            attendees=req.attendees,
            body=req.body_html or None,
            location=req.location or None,
        )
    except GraphAPIError as e:
        raise HTTPException(502, f"Graph API error: {e.message}")
    return {"event_id": event.id, "sent_count": len(req.attendees)}


@router.get("/workshops/{workshop_id}/rsvp")
async def get_rsvp(workshop_id: str, event_id: str):
    try:
        client = graph_service.get_client()
    except AuthError:
        raise HTTPException(503, "Graph not authenticated. Call /api/v1/graph/auth/start")
    try:
        return await client.get_event_responses(event_id)
    except GraphAPIError as e:
        raise HTTPException(502, f"Graph API error: {e.message}")


class RemindRequest(BaseModel):
    event_id: str
    subject: str
    body_html: str


@router.post("/workshops/{workshop_id}/remind")
async def send_reminders(workshop_id: str, req: RemindRequest):
    try:
        client = graph_service.get_client()
    except AuthError:
        raise HTTPException(503, "Graph not authenticated. Call /api/v1/graph/auth/start")
    try:
        rsvp = await client.get_event_responses(req.event_id)
    except GraphAPIError as e:
        raise HTTPException(502, f"Graph API error: {e.message}")
    targets = rsvp.get("none", []) + rsvp.get("tentativelyAccepted", [])
    sent = 0
    failed = []
    for addr in targets:
        try:
            await client.send_email(to=[addr], subject=req.subject, body=req.body_html, html=True)
            sent += 1
        except GraphAPIError:
            failed.append(addr)
    return {"sent_count": sent, "targets": targets, "failed_targets": failed}
