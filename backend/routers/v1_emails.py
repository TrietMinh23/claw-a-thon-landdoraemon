# backend/routers/v1_emails.py
import os
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import mock_data
import services.graph_service as graph_service
from graph.exceptions import AuthError, GraphAPIError

# Mutable at runtime via POST /api/v1/_config/mock-email
_mock_email_send: bool = os.getenv("MOCK_EMAIL_SEND", "true").lower() != "false"

router = APIRouter(prefix="/api/v1")

# In-memory store for compose-generated drafts (not in mock_data)
_compose_drafts: dict[str, dict] = {}


@router.get("/emails")
def list_emails():
    result = []
    for email in mock_data.EMAIL_DRAFTS:
        e = dict(email)
        if e["id"] in mock_data.approved_emails:
            e["status"] = "approved"
        result.append(e)
    for draft in _compose_drafts.values():
        result.append(dict(draft))
    return result


class EmailDraftIn(BaseModel):
    id: str
    type: str
    label: str
    session: int | None = None
    date: str
    count: int
    status: str = "pending"
    time: str
    preview: str
    body: str = ""
    subject: str = ""
    to: list[str] = []


@router.post("/emails")
def create_email_draft(draft: EmailDraftIn):
    _compose_drafts[draft.id] = draft.model_dump()
    return {"id": draft.id}


@router.put("/emails/{email_id}/approve")
async def approve_email(email_id: str):
    draft = next((e for e in mock_data.EMAIL_DRAFTS if e["id"] == email_id), None)
    if draft is None:
        draft = _compose_drafts.get(email_id)
    if draft is None:
        raise HTTPException(404, "Email not found")
    to = draft.get("to") or []
    subject = draft.get("subject") or "(no subject)"
    body = draft.get("body") or draft.get("preview") or ""
    if not to:
        raise HTTPException(400, "Email có no recipients")
    if _mock_email_send:
        print(f"[mock] Would send '{subject}' → {to}")
    else:
        try:
            client = graph_service.get_client()
        except AuthError:
            raise HTTPException(503, "Graph not authenticated. Call /api/v1/graph/auth/start")
        try:
            await client.send_email(to=to, subject=subject, body=body, html=True)
        except GraphAPIError as e:
            raise HTTPException(502, f"Graph API error: {e.message}")
    mock_data.approved_emails.add(email_id)
    if email_id in _compose_drafts:
        _compose_drafts[email_id]["status"] = "approved"
    return {"id": email_id, "status": "sent"}


class MockEmailConfig(BaseModel):
    enabled: bool


@router.post("/_config/mock-email", include_in_schema=False)
def set_mock_email(config: MockEmailConfig):
    global _mock_email_send
    _mock_email_send = config.enabled
    return {"mock_email_send": _mock_email_send}


@router.get("/_config/mock-email", include_in_schema=False)
def get_mock_email():
    return {"mock_email_send": _mock_email_send}
