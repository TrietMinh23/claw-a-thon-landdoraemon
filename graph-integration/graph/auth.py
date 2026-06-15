import os
import webbrowser
from http.server import BaseHTTPRequestHandler, HTTPServer
from urllib.parse import parse_qs, urlparse

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
REDIRECT_URI = os.getenv("REDIRECT_URI", "http://localhost:8000/callback")
TOKEN_CACHE_PATH = os.getenv("TOKEN_CACHE_PATH", "token_cache.json")
AUTHORITY = f"https://login.microsoftonline.com/{TENANT_ID}"

SCOPES = [
    "Mail.Send",
    "Mail.ReadWrite",
    "Calendars.ReadWrite",
    "User.Read",
    "Files.Read.All",
    "Sites.Read.All",
    "offline_access",
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


def _build_app(cache: msal.SerializableTokenCache) -> msal.ConfidentialClientApplication:
    if not CLIENT_ID or not TENANT_ID or not CLIENT_SECRET:
        raise EnvironmentError("CLIENT_ID, TENANT_ID, and CLIENT_SECRET must be set in .env")
    return msal.ConfidentialClientApplication(
        CLIENT_ID,
        authority=AUTHORITY,
        client_credential=CLIENT_SECRET,
        token_cache=cache,
    )


def _get_auth_code_via_browser(app: msal.ConfidentialClientApplication) -> str:
    auth_url = app.get_authorization_request_url(SCOPES, redirect_uri=REDIRECT_URI)
    code_holder: dict = {}

    class _CallbackHandler(BaseHTTPRequestHandler):
        def do_GET(self):
            params = parse_qs(urlparse(self.path).query)
            if "code" in params:
                code_holder["code"] = params["code"][0]
            self.send_response(200)
            self.end_headers()
            self.wfile.write(b"<h1>Login successful. You can close this window.</h1>")

        def log_message(self, *args):
            pass  # suppress server logs

    server = HTTPServer(("localhost", 8000), _CallbackHandler)
    webbrowser.open(auth_url)
    server.handle_request()  # blocks until one callback received

    if "code" not in code_holder:
        raise AuthError("No authorization code received from callback")
    return code_holder["code"]


def get_access_token() -> str:
    cache = _load_cache()
    app = _build_app(cache)
    result = None

    accounts = app.get_accounts()
    if accounts:
        result = app.acquire_token_silent(SCOPES, account=accounts[0])

    if not result:
        code = _get_auth_code_via_browser(app)
        result = app.acquire_token_by_authorization_code(
            code,
            scopes=SCOPES,
            redirect_uri=REDIRECT_URI,
        )

    if "error" in result:
        raise AuthError(result.get("error_description", result["error"]))

    _save_cache(cache)
    return result["access_token"]
