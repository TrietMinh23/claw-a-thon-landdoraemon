# backend/tests/test_v1_emails.py
from fastapi.testclient import TestClient
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

import mock_data
from fastapi import FastAPI
from routers.v1_emails import router

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
    r = client.put("/api/v1/emails/em-001/approve")
    assert r.status_code == 200
    assert r.json()["status"] == "approved"
    r2 = client.get("/api/v1/emails")
    statuses = {e["id"]: e["status"] for e in r2.json()}
    assert statuses["em-001"] == "approved"
    assert statuses["em-002"] == "pending"


def test_approve_nonexistent():
    r = client.put("/api/v1/emails/em-999/approve")
    assert r.status_code == 404
