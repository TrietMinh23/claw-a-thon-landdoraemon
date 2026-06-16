import os
import time
import threading

import msal

from graph.auth import (
    _load_token_cache,
    _save_token_cache,
    CLIENT_ID,
    TENANT_ID,
    SCOPE_STRING,
    TOKEN_CACHE_PATH,
)
from graph.client import GraphClient
from graph.exceptions import AuthError, UpstreamAuthError

_client: GraphClient | None = None
_msal_app: msal.PublicClientApplication | None = None

# Auth state shared between start_device_flow and poll_device_flow
_auth_state: dict = {
    "flow": None,          # MSAL flow dict
    "result": None,        # token result once done
    "error": None,         # error message if failed
    "thread": None,        # background thread
}
_auth_lock = threading.Lock()


def _get_msal_app() -> msal.PublicClientApplication:
    global _msal_app
    if _msal_app is None:
        _msal_app = msal.PublicClientApplication(
            CLIENT_ID,
            authority=f"https://login.microsoftonline.com/{TENANT_ID}",
        )
    return _msal_app


def _acquire_in_background(flow: dict) -> None:
    app = _get_msal_app()
    try:
        result = app.acquire_token_by_device_flow(flow)
        print(f"[graph_service] MSAL result: {list(result.keys())}, error={result.get('error', 'none')}")
        with _auth_lock:
            if "access_token" in result:
                cache = {
                    "access_token": result["access_token"],
                    "refresh_token": result.get("refresh_token", ""),
                    "expires_at": time.time() + result.get("expires_in", 3600),
                }
                _save_token_cache(cache)
                _auth_state["result"] = result
            else:
                _auth_state["error"] = result.get("error_description", result.get("error", "Unknown error"))
    except Exception as e:
        with _auth_lock:
            _auth_state["error"] = str(e)


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
    global _auth_state
    app = _get_msal_app()
    scopes = SCOPE_STRING.split()
    flow = app.initiate_device_flow(scopes=scopes)
    if "user_code" not in flow:
        raise AuthError(f"Device flow failed: {flow.get('error_description', flow)}")

    with _auth_lock:
        # Cancel previous thread if still running
        _auth_state["flow"] = flow
        _auth_state["result"] = None
        _auth_state["error"] = None
        t = threading.Thread(target=_acquire_in_background, args=(flow,), daemon=True)
        _auth_state["thread"] = t
        t.start()

    return {
        "user_code": flow["user_code"],
        "verification_uri": flow["verification_uri"],
        "message": flow["message"],
    }


def poll_device_flow() -> bool:
    if is_authenticated():
        return True

    with _auth_lock:
        if _auth_state["flow"] is None:
            raise AuthError("No device flow in progress. Call /auth/start first.")
        if _auth_state["result"] is not None:
            return True
        if _auth_state["error"] is not None:
            err = _auth_state["error"]
            _auth_state["flow"] = None
            _auth_state["result"] = None
            _auth_state["error"] = None
            raise UpstreamAuthError(err)

    return False


def reset_client() -> None:
    global _client, _msal_app
    _client = None
    _msal_app = None
    with _auth_lock:
        _auth_state["flow"] = None
        _auth_state["result"] = None
        _auth_state["error"] = None
    if os.path.exists(TOKEN_CACHE_PATH):
        os.remove(TOKEN_CACHE_PATH)
