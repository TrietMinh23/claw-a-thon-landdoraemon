import os

import msal
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

SCOPES = [
    "Mail.Send",
    "Mail.ReadWrite",
    "Calendars.ReadWrite",
    "User.Read",
    "Files.Read.All",
    "Sites.Read.All",
]


def _load_cache() -> msal.SerializableTokenCache:
    cache = msal.SerializableTokenCache()
    if os.path.exists(TOKEN_CACHE_PATH):
        try:
            with open(TOKEN_CACHE_PATH, "r") as f:
                cache.deserialize(f.read())
        except Exception as e:
            raise TokenCacheError(f"Failed to load token cache: {e}")
    return cache


def _save_cache(cache: msal.SerializableTokenCache) -> None:
    if cache.has_state_changed:
        try:
            with open(TOKEN_CACHE_PATH, "w") as f:
                f.write(cache.serialize())
        except OSError as e:
            raise TokenCacheError(f"Failed to save token cache: {e}")


def _build_app(cache: msal.SerializableTokenCache) -> msal.PublicClientApplication:
    if not CLIENT_ID or not TENANT_ID:
        raise EnvironmentError("CLIENT_ID and TENANT_ID must be set in .env")
    return msal.PublicClientApplication(
        CLIENT_ID,
        authority=AUTHORITY,
        token_cache=cache,
    )


def get_access_token() -> str:
    cache = _load_cache()
    app = _build_app(cache)
    result = None

    accounts = app.get_accounts()
    if accounts:
        result = app.acquire_token_silent(SCOPES, account=accounts[0])

    if not result:
        flow = app.initiate_device_flow(scopes=SCOPES)
        if "user_code" not in flow:
            raise AuthError(f"Device flow failed: {flow.get('error_description', flow)}")
        print(flow["message"])  # "Go to https://microsoft.com/devicelogin and enter code: XXXXX"
        result = app.acquire_token_by_device_flow(flow)  # blocks until user authenticates

    if "error" in result:
        raise AuthError(result.get("error_description", result["error"]))

    _save_cache(cache)
    return result["access_token"]
