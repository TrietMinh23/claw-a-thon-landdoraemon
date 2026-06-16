import os
import time
import httpx

from graph.auth import (
    _load_token_cache,
    _save_token_cache,
    CLIENT_ID,
    CLIENT_SECRET,
    TOKEN_URL,
    DEVICE_CODE_URL,
    SCOPE_STRING,
    TOKEN_CACHE_PATH,
)
from graph.client import GraphClient
from graph.exceptions import AuthError, UpstreamAuthError

_client: GraphClient | None = None
_pending_flow: dict | None = None


def is_authenticated() -> bool:
    try:
        cache = _load_token_cache()
        return "access_token" in cache and cache.get("expires_at", 0) > time.time() + 60
    except Exception:
        return False


def get_client() -> GraphClient:
    global _client
    if not is_authenticated():
        raise AuthError("Not authenticated. Call /api/v1/graph/auth/start")
    if _client is None:
        _client = GraphClient()
    return _client


def start_device_flow() -> dict:
    global _pending_flow
    r = httpx.post(DEVICE_CODE_URL, data={
        "client_id": CLIENT_ID,
        "scope": SCOPE_STRING,
    })
    flow = r.json()
    if "user_code" not in flow:
        raise AuthError(f"Device flow failed: {flow.get('error_description', flow)}")
    _pending_flow = {
        "device_code": flow["device_code"],
        "user_code": flow["user_code"],
        "verification_uri": flow["verification_uri"],
        "expires_at": time.time() + flow.get("expires_in", 900),
        "interval": flow.get("interval", 5),
    }
    return {
        "user_code": flow["user_code"],
        "verification_uri": flow["verification_uri"],
        "message": flow["message"],
    }


def poll_device_flow() -> bool:
    global _pending_flow
    if _pending_flow is None:
        raise AuthError("No device flow in progress. Call /auth/start first.")
    if time.time() > _pending_flow["expires_at"]:
        _pending_flow = None
        raise AuthError("Device flow expired. Call /auth/start again.")
    r = httpx.post(TOKEN_URL, data={
        "grant_type": "urn:ietf:params:oauth:grant-type:device_code",
        "device_code": _pending_flow["device_code"],
        "client_id": CLIENT_ID,
        "client_secret": CLIENT_SECRET,
    })
    result = r.json()
    if "access_token" in result:
        cache = {
            "access_token": result["access_token"],
            "refresh_token": result.get("refresh_token", ""),
            "expires_at": time.time() + result.get("expires_in", 3600),
        }
        _save_token_cache(cache)
        _pending_flow = None
        return True
    error = result.get("error")
    if error in ("authorization_pending", "slow_down"):
        if error == "slow_down":
            _pending_flow["interval"] += 5
        return False
    _pending_flow = None
    raise UpstreamAuthError(result.get("error_description", error))


def reset_client() -> None:
    global _client, _pending_flow
    _client = None
    _pending_flow = None
    if os.path.exists(TOKEN_CACHE_PATH):
        os.remove(TOKEN_CACHE_PATH)
