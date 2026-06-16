import os
import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, AsyncMock, MagicMock

os.environ.setdefault("CLIENT_ID", "test-client-id")
os.environ.setdefault("TENANT_ID", "test-tenant-id")
os.environ.setdefault("CLIENT_SECRET", "test-secret")
os.environ.setdefault("TOKEN_CACHE_PATH", "/tmp/test_token_cache.json")
os.environ.setdefault("AI_PLATFORM_API_KEY", "test-key")


def make_app():
    from fastapi import FastAPI
    from routers.v1_graph import router
    app = FastAPI()
    app.include_router(router)
    return app


def test_auth_status_not_authenticated():
    with patch("routers.v1_graph.graph_service") as mock_svc:
        mock_svc.is_authenticated.return_value = False
        client = TestClient(make_app())
        resp = client.get("/api/v1/graph/auth/status")
    assert resp.status_code == 200
    assert resp.json()["authenticated"] is False


def test_auth_status_authenticated():
    mock_me = MagicMock()
    mock_me.display_name = "Toro"
    mock_me.mail = "toro@zalopay.vn"
    mock_graph = AsyncMock()
    mock_graph.get_me = AsyncMock(return_value=mock_me)
    with patch("routers.v1_graph.graph_service") as mock_svc:
        mock_svc.is_authenticated.return_value = True
        mock_svc.get_client.return_value = mock_graph
        client = TestClient(make_app())
        resp = client.get("/api/v1/graph/auth/status")
    assert resp.status_code == 200
    data = resp.json()
    assert data["authenticated"] is True
    assert data["user_display_name"] == "Toro"


def test_auth_start_success():
    with patch("routers.v1_graph.graph_service") as mock_svc:
        mock_svc.start_device_flow.return_value = {
            "user_code": "ABCD1234",
            "verification_uri": "https://microsoft.com/devicelogin",
            "message": "Go to https://microsoft.com/devicelogin and enter ABCD1234",
        }
        client = TestClient(make_app())
        resp = client.post("/api/v1/graph/auth/start")
    assert resp.status_code == 200
    assert resp.json()["user_code"] == "ABCD1234"


def test_auth_poll_pending():
    with patch("routers.v1_graph.graph_service") as mock_svc:
        mock_svc.poll_device_flow.return_value = False
        client = TestClient(make_app())
        resp = client.post("/api/v1/graph/auth/poll")
    assert resp.status_code == 200
    assert resp.json()["done"] is False


def test_auth_poll_done():
    with patch("routers.v1_graph.graph_service") as mock_svc:
        mock_svc.poll_device_flow.return_value = True
        client = TestClient(make_app())
        resp = client.post("/api/v1/graph/auth/poll")
    assert resp.status_code == 200
    assert resp.json()["done"] is True


def test_auth_logout():
    with patch("routers.v1_graph.graph_service") as mock_svc:
        client = TestClient(make_app())
        resp = client.delete("/api/v1/graph/auth/logout")
    assert resp.status_code == 200
    mock_svc.reset_client.assert_called_once()
