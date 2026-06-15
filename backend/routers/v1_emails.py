# backend/routers/v1_emails.py
from fastapi import APIRouter, HTTPException
import mock_data

router = APIRouter(prefix="/api/v1")


@router.get("/emails")
def list_emails():
    result = []
    for email in mock_data.EMAIL_DRAFTS:
        e = dict(email)
        if e["id"] in mock_data.approved_emails:
            e["status"] = "approved"
        result.append(e)
    return result


@router.put("/emails/{email_id}/approve")
def approve_email(email_id: str):
    ids = {e["id"] for e in mock_data.EMAIL_DRAFTS}
    if email_id not in ids:
        raise HTTPException(404, "Email not found")
    mock_data.approved_emails.add(email_id)
    return {"id": email_id, "status": "approved"}
