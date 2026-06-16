# backend/tests/test_v1_workshops.py
from fastapi.testclient import TestClient
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

# We need to import main AFTER the sys.path is set
# But main.py needs to include the router first (Task 6).
# For now, test the router directly:
from fastapi import FastAPI
from routers.v1_workshops import router

app = FastAPI()
app.include_router(router)
client = TestClient(app)


def test_list_workshops():
    r = client.get("/api/v1/workshops")
    assert r.status_code == 200
    data = r.json()
    assert len(data) == 3


def test_get_workshop():
    r = client.get("/api/v1/workshops/wb-001")
    assert r.status_code == 200
    assert r.json()["id"] == "wb-001"


def test_get_workshop_not_found():
    r = client.get("/api/v1/workshops/wb-999")
    assert r.status_code == 404


def test_get_attendees():
    r = client.get("/api/v1/workshops/wb-001/attendees")
    assert r.status_code == 200
    assert len(r.json()) == 8


import pytest
from unittest.mock import patch, AsyncMock, MagicMock


def make_workshops_app():
    from fastapi import FastAPI
    from routers.v1_workshops import router
    app = FastAPI()
    app.include_router(router)
    return app


def test_invite_creates_event_and_returns_event_id():
    mock_event = MagicMock()
    mock_event.id = "event-abc123"
    mock_client = AsyncMock()
    mock_client.create_event = AsyncMock(return_value=mock_event)
    with patch("routers.v1_workshops.graph_service") as mock_svc:
        mock_svc.get_client.return_value = mock_client
        client = TestClient(make_workshops_app())
        resp = client.post("/api/v1/workshops/wb-001/invite", json={
            "attendees": ["minhNV@zalopay.vn", "lanTT@zalopay.vn"],
            "subject": "Workshop Invite",
            "start": "2026-03-25T09:30:00+07:00",
            "end": "2026-03-25T12:00:00+07:00",
            "location": "Hà Nội Room",
            "body_html": "<p>Mời bạn tham dự</p>",
        })
    assert resp.status_code == 200
    data = resp.json()
    assert data["event_id"] == "event-abc123"
    assert data["sent_count"] == 2


def test_invite_503_when_not_authenticated():
    from graph.exceptions import AuthError
    with patch("routers.v1_workshops.graph_service") as mock_svc:
        mock_svc.get_client.side_effect = AuthError("Not authenticated")
        client = TestClient(make_workshops_app())
        resp = client.post("/api/v1/workshops/wb-001/invite", json={
            "attendees": ["minhNV@zalopay.vn"],
            "subject": "Test",
            "start": "2026-03-25T09:30:00+07:00",
            "end": "2026-03-25T12:00:00+07:00",
        })
    assert resp.status_code == 503


def test_rsvp_returns_response_dict():
    mock_client = AsyncMock()
    mock_client.get_event_responses = AsyncMock(return_value={
        "accepted": ["minhNV@zalopay.vn"],
        "declined": [],
        "tentativelyAccepted": ["lanTT@zalopay.vn"],
        "none": [],
    })
    with patch("routers.v1_workshops.graph_service") as mock_svc:
        mock_svc.get_client.return_value = mock_client
        client = TestClient(make_workshops_app())
        resp = client.get("/api/v1/workshops/wb-001/rsvp?event_id=event-abc123")
    assert resp.status_code == 200
    assert "accepted" in resp.json()
    assert "minhNV@zalopay.vn" in resp.json()["accepted"]


def test_remind_sends_to_none_and_tentative():
    rsvp = {
        "accepted": ["minhNV@zalopay.vn"],
        "declined": [],
        "tentativelyAccepted": ["lanTT@zalopay.vn"],
        "none": ["hungL@zalopay.vn"],
    }
    mock_client = AsyncMock()
    mock_client.get_event_responses = AsyncMock(return_value=rsvp)
    mock_client.send_email = AsyncMock(return_value=None)
    with patch("routers.v1_workshops.graph_service") as mock_svc:
        mock_svc.get_client.return_value = mock_client
        client = TestClient(make_workshops_app())
        resp = client.post("/api/v1/workshops/wb-001/remind", json={
            "event_id": "event-abc123",
            "subject": "Reminder",
            "body_html": "<p>Nhắc nhở tham dự</p>",
        })
    assert resp.status_code == 200
    assert resp.json()["sent_count"] == 2
    assert mock_client.send_email.await_count == 2
