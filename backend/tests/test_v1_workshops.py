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
