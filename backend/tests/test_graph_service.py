import os
import time
import pytest
from unittest.mock import patch, MagicMock

os.environ.setdefault("CLIENT_ID", "test-client-id")
os.environ.setdefault("TENANT_ID", "test-tenant-id")
os.environ.setdefault("CLIENT_SECRET", "test-secret")
os.environ.setdefault("TOKEN_CACHE_PATH", "/tmp/test_token_cache.json")


def test_is_authenticated_no_cache():
    with patch("services.graph_service._load_token_cache", return_value={}):
        import services.graph_service as svc
        assert svc.is_authenticated() is False


def test_is_authenticated_valid_token():
    cache = {"access_token": "tok", "expires_at": time.time() + 7200}
    with patch("services.graph_service._load_token_cache", return_value=cache):
        import services.graph_service as svc
        assert svc.is_authenticated() is True


def test_is_authenticated_expired_token():
    cache = {"access_token": "tok", "expires_at": time.time() - 10}
    with patch("services.graph_service._load_token_cache", return_value=cache):
        import services.graph_service as svc
        assert svc.is_authenticated() is False


def test_get_client_raises_when_not_authenticated():
    import services.graph_service as svc
    from graph.exceptions import AuthError
    with patch.object(svc, "is_authenticated", return_value=False):
        with pytest.raises(AuthError):
            svc.get_client()


def test_start_device_flow_success():
    import services.graph_service as svc
    mock_response = MagicMock()
    mock_response.json.return_value = {
        "user_code": "ABCD1234",
        "device_code": "device-xyz",
        "verification_uri": "https://microsoft.com/devicelogin",
        "message": "Go to https://microsoft.com/devicelogin and enter ABCD1234",
        "expires_in": 900,
        "interval": 5,
    }
    with patch("services.graph_service.httpx") as mock_httpx:
        mock_httpx.post.return_value = mock_response
        result = svc.start_device_flow()
    assert result["user_code"] == "ABCD1234"
    assert result["verification_uri"] == "https://microsoft.com/devicelogin"
    assert "message" in result


def test_poll_device_flow_pending():
    import services.graph_service as svc
    svc._pending_flow = {
        "device_code": "device-xyz",
        "expires_at": time.time() + 900,
        "interval": 5,
    }
    mock_response = MagicMock()
    mock_response.json.return_value = {"error": "authorization_pending"}
    with patch("services.graph_service.httpx") as mock_httpx:
        mock_httpx.post.return_value = mock_response
        result = svc.poll_device_flow()
    assert result is False


def test_poll_device_flow_success():
    import services.graph_service as svc
    svc._pending_flow = {
        "device_code": "device-xyz",
        "expires_at": time.time() + 900,
        "interval": 5,
    }
    mock_response = MagicMock()
    mock_response.json.return_value = {
        "access_token": "new-token",
        "refresh_token": "new-refresh",
        "expires_in": 3600,
    }
    with patch("services.graph_service.httpx") as mock_httpx, \
         patch("services.graph_service._save_token_cache") as mock_save:
        mock_httpx.post.return_value = mock_response
        result = svc.poll_device_flow()
    assert result is True
    assert svc._pending_flow is None
    mock_save.assert_called_once()


def test_reset_client():
    import services.graph_service as svc
    svc._client = MagicMock()
    svc._pending_flow = {"device_code": "x"}
    with patch("os.path.exists", return_value=False):
        svc.reset_client()
    assert svc._client is None
    assert svc._pending_flow is None
