# backend/tests/test_v1_emails.py
from fastapi.testclient import TestClient
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

import mock_data
from fastapi import FastAPI
from routers.v1_emails import router
from unittest.mock import patch, AsyncMock

app = FastAPI()
app.include_router(router)
client = TestClient(app)


def setup_function():
    mock_data.approved_emails.clear()


def test_list_emails():
    r = client.get("/api/v1/emails")
    assert r.status_code == 200
    emails = r.json()
    assert len(emails) == 7
    assert all(e["status"] == "pending" for e in emails)


def test_approve_email():
    mock_graph_client = AsyncMock()
    mock_graph_client.send_email = AsyncMock(return_value=None)
    with patch("routers.v1_emails.graph_service") as mock_svc:
        mock_svc.get_client.return_value = mock_graph_client
        r = client.put("/api/v1/emails/em-001/approve")
    assert r.status_code == 200
    assert r.json()["status"] == "sent"
    r2 = client.get("/api/v1/emails")
    statuses = {e["id"]: e["status"] for e in r2.json()}
    assert statuses["em-001"] == "approved"
    assert statuses["em-002"] == "pending"


def test_approve_nonexistent():
    with patch("routers.v1_emails.graph_service"):
        r = client.put("/api/v1/emails/em-999/approve")
    assert r.status_code == 404


def make_emails_app():
    from fastapi import FastAPI
    from routers.v1_emails import router
    app = FastAPI()
    app.include_router(router)
    return app


def test_approve_sends_email_via_graph():
    mock_client = AsyncMock()
    mock_client.send_email = AsyncMock(return_value=None)
    with patch("routers.v1_emails.graph_service") as mock_svc:
        mock_svc.get_client.return_value = mock_client
        client = TestClient(make_emails_app())
        resp = client.put("/api/v1/emails/em-001/approve")
    assert resp.status_code == 200
    assert resp.json()["status"] == "sent"
    mock_client.send_email.assert_awaited_once()


def test_approve_503_when_not_authenticated():
    from graph.exceptions import AuthError
    with patch("routers.v1_emails.graph_service") as mock_svc:
        mock_svc.get_client.side_effect = AuthError("Not authenticated")
        client = TestClient(make_emails_app())
        resp = client.put("/api/v1/emails/em-001/approve")
    assert resp.status_code == 503


def test_approve_404_unknown_email():
    with patch("routers.v1_emails.graph_service"):
        client = TestClient(make_emails_app())
        resp = client.put("/api/v1/emails/em-999/approve")
    assert resp.status_code == 404
