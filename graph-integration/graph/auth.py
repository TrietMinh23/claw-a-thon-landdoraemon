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
        with open(TOKEN_CACHE_PATH, "w") as f:
            f.write(cache.serialize())
