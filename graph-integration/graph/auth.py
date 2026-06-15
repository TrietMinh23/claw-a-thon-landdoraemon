import json
import os
import time

import httpx
from dotenv import load_dotenv

from graph.exceptions import AuthError, TokenCacheError

try:
    load_dotenv()
except Exception:
    pass

CLIENT_ID = os.getenv("CLIENT_ID")
CLIENT_SECRET = os.getenv("CLIENT_SECRET")
TENANT_ID = os.getenv("TENANT_ID")
TOKEN_CACHE_PATH = os.getenv("TOKEN_CACHE_PATH", "token_cache.json")
AUTHORITY = f"https://login.microsoftonline.com/{TENANT_ID}"
TOKEN_URL = f"{AUTHORITY}/oauth2/v2.0/token"
DEVICE_CODE_URL = f"{AUTHORITY}/oauth2/v2.0/devicecode"

SCOPES = [
    "Mail.Send",
    "Mail.ReadWrite",
    "Calendars.ReadWrite",
    "User.Read",
    "Files.Read.All",
    "Sites.Read.All",
]
SCOPE_STRING = " ".join(SCOPES)


def _load_token_cache() -> dict:
    if os.path.exists(TOKEN_CACHE_PATH):
        try:
            with open(TOKEN_CACHE_PATH, "r") as f:
                return json.load(f)
        except Exception as e:
            raise TokenCacheError(f"Failed to load token cache: {e}")
    return {}


def _save_token_cache(data: dict) -> None:
    try:
        with open(TOKEN_CACHE_PATH, "w") as f:
            json.dump(data, f)
    except OSError as e:
        raise TokenCacheError(f"Failed to save token cache: {e}")


def _refresh_access_token(refresh_token: str) -> dict:
    r = httpx.post(TOKEN_URL, data={
        "grant_type": "refresh_token",
        "refresh_token": refresh_token,
        "client_id": CLIENT_ID,
        "client_secret": CLIENT_SECRET,
        "scope": SCOPE_STRING,
    })
    result = r.json()
    if "access_token" not in result:
        raise AuthError(result.get("error_description", result.get("error", "Token refresh failed")))
    return result


def _device_flow() -> dict:
    if not CLIENT_ID or not TENANT_ID or not CLIENT_SECRET:
        raise EnvironmentError("CLIENT_ID, TENANT_ID, and CLIENT_SECRET must be set in .env")

    r = httpx.post(DEVICE_CODE_URL, data={
        "client_id": CLIENT_ID,
        "scope": SCOPE_STRING,
    })
    flow = r.json()
    if "user_code" not in flow:
        raise AuthError(f"Device flow failed: {flow.get('error_description', flow)}")

    print(flow["message"])

    interval = flow.get("interval", 5)
    while True:
        time.sleep(interval)
        r = httpx.post(TOKEN_URL, data={
            "grant_type": "urn:ietf:params:oauth:grant-type:device_code",
            "device_code": flow["device_code"],
            "client_id": CLIENT_ID,
            "client_secret": CLIENT_SECRET,
        })
        result = r.json()
        if "access_token" in result:
            return result
        error = result.get("error")
        if error == "authorization_pending":
            continue
        elif error == "slow_down":
            interval += 5
        else:
            raise AuthError(result.get("error_description", error))


def get_access_token() -> str:
    cache = _load_token_cache()

    if "access_token" in cache:
        if cache.get("expires_at", 0) > time.time() + 60:
            return cache["access_token"]
        if "refresh_token" in cache:
            try:
                result = _refresh_access_token(cache["refresh_token"])
                cache = {
                    "access_token": result["access_token"],
                    "refresh_token": result.get("refresh_token", cache["refresh_token"]),
                    "expires_at": time.time() + result.get("expires_in", 3600),
                }
                _save_token_cache(cache)
                return cache["access_token"]
            except AuthError:
                pass  # fall through to device flow

    result = _device_flow()
    cache = {
        "access_token": result["access_token"],
        "refresh_token": result.get("refresh_token", ""),
        "expires_at": time.time() + result.get("expires_in", 3600),
    }
    _save_token_cache(cache)
    return cache["access_token"]
