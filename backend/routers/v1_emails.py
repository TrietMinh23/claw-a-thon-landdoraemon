# backend/routers/v1_emails.py
from fastapi import APIRouter, HTTPException
import mock_data
import services.graph_service as graph_service
from graph.exceptions import AuthError, GraphAPIError

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
async def approve_email(email_id: str):
    draft = next((e for e in mock_data.EMAIL_DRAFTS if e["id"] == email_id), None)
    if draft is None:
        raise HTTPException(404, "Email not found")
    try:
        client = graph_service.get_client()
    except AuthError:
        raise HTTPException(503, "Graph not authenticated. Call /api/v1/graph/auth/start")
    try:
        await client.send_email(
            to=draft["to"],
            subject=draft["subject"],
            body=draft["body"],
            html=True,
        )
    except GraphAPIError as e:
        raise HTTPException(502, f"Graph API error: {e.message}")
    mock_data.approved_emails.add(email_id)
    return {"id": email_id, "status": "sent"}
