# Microsoft Graph Integration — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Python package `graph/` (inside `graph-integration/` subfolder) that wraps Microsoft Graph API for sending email, reading email, managing calendar events, and reading files from OneDrive/SharePoint — serving the L&D automation flow.

**Architecture:** MSAL handles OAuth2 Authorization Code flow with a stdlib localhost callback server; tokens are persisted to a JSON file via `SerializableTokenCache`. `GraphServiceClient` from `msgraph-sdk` drives all API calls through a thin credential adapter that calls MSAL on each token request.

**Tech Stack:** Python 3.11+, uv, `msal`, `msgraph-sdk`, `python-dotenv`, `pytest`, `pytest-asyncio`

---

## File Map

| File | Purpose |
|---|---|
| `graph-integration/pyproject.toml` | uv project config + all dependencies |
| `graph-integration/.env.example` | credentials template (committed) |
| `graph-integration/.env` | real credentials (NOT committed) |
| `graph-integration/.gitignore` | exclude `.env`, `token_cache.json` |
| `graph-integration/graph/__init__.py` | re-exports `GraphClient` |
| `graph-integration/graph/exceptions.py` | `AuthError`, `GraphAPIError`, `TokenCacheError` |
| `graph-integration/graph/auth.py` | MSAL app, auth code flow, token cache |
| `graph-integration/graph/client.py` | `GraphClient` — thin wrapper over `msgraph-sdk` |
| `graph-integration/tests/__init__.py` | empty |
| `graph-integration/tests/test_exceptions.py` | exception instantiation tests |
| `graph-integration/tests/test_auth.py` | auth module unit tests (mocked MSAL) |
| `graph-integration/tests/test_client.py` | GraphClient method tests (mocked Graph SDK) |

---

### Task 1: Project Setup

**Files:**
- Create: `graph-integration/` (via `uv init`)
- Create: `graph-integration/.env.example`
- Create: `graph-integration/.gitignore`
- Create: `graph-integration/graph/__init__.py`
- Create: `graph-integration/tests/__init__.py`

- [ ] **Step 1: Initialize uv project**

Run from repo root:
```bash
uv init graph-integration
cd graph-integration
```

Expected output:
```
Initialized project `graph-integration`
```

- [ ] **Step 2: Add runtime dependencies**

```bash
uv add msgraph-sdk msal python-dotenv
```

Expected: `pyproject.toml` updated, `uv.lock` created.

- [ ] **Step 3: Add dev dependencies**

```bash
uv add --dev pytest pytest-asyncio
```

- [ ] **Step 4: Configure pytest — append to `pyproject.toml`**

```toml
[tool.pytest.ini_options]
asyncio_mode = "auto"
```

- [ ] **Step 5: Create `.env.example`**

```
CLIENT_ID=059231f1-a801-4313-933c-3a0c06964b39
TENANT_ID=7c112a6e-10e2-4e09-afc4-2e37bc60d821
CLIENT_SECRET=<your-secret>
REDIRECT_URI=http://localhost:8000/callback
TOKEN_CACHE_PATH=token_cache.json
```

- [ ] **Step 6: Create `.gitignore`**

```
.env
token_cache.json
__pycache__/
.pytest_cache/
*.pyc
.venv/
```

- [ ] **Step 7: Create package and test directories**

```bash
mkdir -p graph tests
touch graph/__init__.py tests/__init__.py
```

- [ ] **Step 8: Verify tests run (empty)**

```bash
uv run pytest tests/ -v
```

Expected:
```
no tests ran
```

- [ ] **Step 9: Commit**

```bash
cd ..
git add graph-integration/
git commit -m "chore: init graph-integration uv project"
```

---

### Task 2: Exceptions

**Files:**
- Create: `graph-integration/graph/exceptions.py`
- Create: `graph-integration/tests/test_exceptions.py`

- [ ] **Step 1: Write failing tests**

`graph-integration/tests/test_exceptions.py`:
```python
import pytest
from graph.exceptions import AuthError, GraphAPIError, TokenCacheError


def test_auth_error_is_exception():
    err = AuthError("token revoked")
    assert str(err) == "token revoked"
    assert isinstance(err, Exception)


def test_graph_api_error_stores_status_and_message():
    err = GraphAPIError(status_code=403, message="Forbidden")
    assert err.status_code == 403
    assert err.message == "Forbidden"
    assert "403" in str(err)
    assert "Forbidden" in str(err)


def test_token_cache_error_is_exception():
    err = TokenCacheError("cache corrupt")
    assert str(err) == "cache corrupt"
    assert isinstance(err, Exception)
```

- [ ] **Step 2: Run to verify failure**

```bash
uv run pytest tests/test_exceptions.py -v
```

Expected: `ModuleNotFoundError: No module named 'graph.exceptions'`

- [ ] **Step 3: Implement `graph/exceptions.py`**

```python
class AuthError(Exception):
    pass


class GraphAPIError(Exception):
    def __init__(self, status_code: int, message: str):
        self.status_code = status_code
        self.message = message
        super().__init__(f"Graph API error {status_code}: {message}")


class TokenCacheError(Exception):
    pass
```

- [ ] **Step 4: Run tests**

```bash
uv run pytest tests/test_exceptions.py -v
```

Expected: 3 passed.

- [ ] **Step 5: Commit**

```bash
git add graph/exceptions.py tests/test_exceptions.py
git commit -m "feat: add custom exception types"
```

---

### Task 3: Auth Module — Token Cache

**Files:**
- Create: `graph-integration/graph/auth.py`
- Create: `graph-integration/tests/test_auth.py`

- [ ] **Step 1: Write failing tests for cache load/save**

`graph-integration/tests/test_auth.py`:
```python
from unittest.mock import MagicMock, mock_open, patch

import msal
import pytest

from graph.exceptions import TokenCacheError


class TestLoadCache:
    def test_returns_empty_cache_when_no_file(self):
        with patch("os.path.exists", return_value=False):
            from graph.auth import _load_cache
            cache = _load_cache()
            assert isinstance(cache, msal.SerializableTokenCache)

    def test_deserializes_cache_from_file(self):
        fake_data = '{"AccessToken": {}}'
        with patch("graph.auth.os.path.exists", return_value=True), \
             patch("builtins.open", mock_open(read_data=fake_data)):
            from graph.auth import _load_cache
            with patch.object(msal.SerializableTokenCache, "deserialize") as mock_deser:
                _load_cache()
                mock_deser.assert_called_once_with(fake_data)

    def test_raises_token_cache_error_when_file_unreadable(self):
        with patch("graph.auth.os.path.exists", return_value=True), \
             patch("builtins.open", side_effect=OSError("permission denied")):
            from graph.auth import _load_cache
            with pytest.raises(TokenCacheError, match="permission denied"):
                _load_cache()


class TestSaveCache:
    def test_writes_when_state_changed(self):
        mock_cache = MagicMock()
        mock_cache.has_state_changed = True
        mock_cache.serialize.return_value = '{"AccessToken": {}}'
        with patch("builtins.open", mock_open()) as mock_file, \
             patch("graph.auth.TOKEN_CACHE_PATH", "cache.json"):
            from graph.auth import _save_cache
            _save_cache(mock_cache)
            mock_file.assert_called_once_with("cache.json", "w")

    def test_skips_write_when_state_unchanged(self):
        mock_cache = MagicMock()
        mock_cache.has_state_changed = False
        with patch("builtins.open", mock_open()) as mock_file:
            from graph.auth import _save_cache
            _save_cache(mock_cache)
            mock_file.assert_not_called()
```

- [ ] **Step 2: Run to verify failure**

```bash
uv run pytest tests/test_auth.py -v
```

Expected: `ImportError` — `graph.auth` not found.

- [ ] **Step 3: Implement token cache section of `graph/auth.py`**

```python
import os
import webbrowser
from http.server import BaseHTTPRequestHandler, HTTPServer
from urllib.parse import parse_qs, urlparse

import msal
from dotenv import load_dotenv

from graph.exceptions import AuthError, TokenCacheError

load_dotenv()

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
```

- [ ] **Step 4: Run cache tests**

```bash
uv run pytest tests/test_auth.py::TestLoadCache tests/test_auth.py::TestSaveCache -v
```

Expected: 5 passed.

- [ ] **Step 5: Commit**

```bash
git add graph/auth.py tests/test_auth.py
git commit -m "feat: implement token cache load/save"
```

---

### Task 4: Auth Module — MSAL App + `get_access_token()`

**Files:**
- Modify: `graph-integration/graph/auth.py`
- Modify: `graph-integration/tests/test_auth.py`

- [ ] **Step 1: Add failing tests for `get_access_token()`**

Append to `graph-integration/tests/test_auth.py`:
```python
import graph.auth as auth_module
from graph.auth import get_access_token
from graph.exceptions import AuthError


class TestGetAccessToken:
    def _mock_app(self, accounts=None, silent_result=None):
        app = MagicMock()
        app.get_accounts.return_value = accounts or []
        app.acquire_token_silent.return_value = silent_result
        return app

    def test_returns_token_from_silent_when_account_in_cache(self):
        app = self._mock_app(
            accounts=[{"username": "user@co.com"}],
            silent_result={"access_token": "tok-silent"},
        )
        with patch.object(auth_module, "_load_cache", return_value=MagicMock()), \
             patch.object(auth_module, "_build_app", return_value=app), \
             patch.object(auth_module, "_save_cache"):
            assert get_access_token() == "tok-silent"
            app.acquire_token_silent.assert_called_once()

    def test_opens_browser_when_no_cached_account(self):
        app = self._mock_app(accounts=[])
        app.acquire_token_by_authorization_code.return_value = {"access_token": "tok-browser"}
        with patch.object(auth_module, "_load_cache", return_value=MagicMock()), \
             patch.object(auth_module, "_build_app", return_value=app), \
             patch.object(auth_module, "_save_cache"), \
             patch.object(auth_module, "_get_auth_code_via_browser", return_value="code-xyz"):
            assert get_access_token() == "tok-browser"
            app.acquire_token_by_authorization_code.assert_called_once()

    def test_raises_auth_error_when_msal_returns_error(self):
        app = self._mock_app(
            accounts=[{"username": "user@co.com"}],
            silent_result={"error": "invalid_grant", "error_description": "Token expired"},
        )
        with patch.object(auth_module, "_load_cache", return_value=MagicMock()), \
             patch.object(auth_module, "_build_app", return_value=app), \
             patch.object(auth_module, "_save_cache"):
            with pytest.raises(AuthError, match="Token expired"):
                get_access_token()
```

- [ ] **Step 2: Run to verify failure**

```bash
uv run pytest tests/test_auth.py::TestGetAccessToken -v
```

Expected: `AttributeError` — `get_access_token` not found.

- [ ] **Step 3: Append to `graph/auth.py`**

```python
def _build_app(cache: msal.SerializableTokenCache) -> msal.ConfidentialClientApplication:
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
```

- [ ] **Step 4: Run all auth tests**

```bash
uv run pytest tests/test_auth.py -v
```

Expected: 8 passed.

- [ ] **Step 5: Commit**

```bash
git add graph/auth.py tests/test_auth.py
git commit -m "feat: implement MSAL auth code flow and get_access_token"
```

---

### Task 5: GraphClient — Init + `get_me()`

**Files:**
- Create: `graph-integration/graph/client.py`
- Create: `graph-integration/tests/test_client.py`

- [ ] **Step 1: Write failing test**

`graph-integration/tests/test_client.py`:
```python
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

import graph.client as client_module
from graph.client import GraphClient


@pytest.fixture
def mock_graph():
    """Returns a mock GraphServiceClient and patches GraphClient._graph with it."""
    g = MagicMock()
    return g


@pytest.fixture
def client(mock_graph):
    with patch("graph.client.get_access_token", return_value="tok"), \
         patch("graph.client.GraphServiceClient", return_value=mock_graph):
        c = GraphClient()
        c._graph = mock_graph
        return c


class TestGetMe:
    async def test_calls_graph_me_get(self, client, mock_graph):
        mock_graph.me.get = AsyncMock(return_value=MagicMock(display_name="Test User"))
        result = await client.get_me()
        mock_graph.me.get.assert_called_once()
        assert result.display_name == "Test User"
```

- [ ] **Step 2: Run to verify failure**

```bash
uv run pytest tests/test_client.py::TestGetMe -v
```

Expected: `ImportError` — `graph.client` not found.

- [ ] **Step 3: Implement `graph/client.py`**

```python
import time
from datetime import datetime

from azure.core.credentials import AccessToken
from kiota_abstractions.api_error import APIError
from msgraph import GraphServiceClient

from graph.auth import SCOPES, get_access_token
from graph.exceptions import GraphAPIError


class _MSALCredential:
    def get_token(self, *scopes, **kwargs):
        token = get_access_token()
        return AccessToken(token, int(time.time()) + 3600)


class GraphClient:
    def __init__(self):
        self._graph = GraphServiceClient(
            credentials=_MSALCredential(),
            scopes=SCOPES,
        )

    async def get_me(self):
        try:
            return await self._graph.me.get()
        except APIError as e:
            raise GraphAPIError(
                status_code=e.response_status_code,
                message=str(e.error.message if e.error else e),
            )
```

- [ ] **Step 4: Run test**

```bash
uv run pytest tests/test_client.py::TestGetMe -v
```

Expected: 1 passed.

- [ ] **Step 5: Commit**

```bash
git add graph/client.py tests/test_client.py
git commit -m "feat: add GraphClient with get_me()"
```

---

### Task 6: Email Methods — `send_email()` + `list_emails()`

**Files:**
- Modify: `graph-integration/graph/client.py`
- Modify: `graph-integration/tests/test_client.py`

- [ ] **Step 1: Write failing tests**

Append to `tests/test_client.py`:
```python
class TestSendEmail:
    async def test_calls_send_mail_post(self, client, mock_graph):
        mock_graph.me.send_mail.post = AsyncMock(return_value=None)
        await client.send_email(
            to=["a@co.com", "b@co.com"],
            subject="Workshop Invite",
            body="<p>Hello</p>",
        )
        mock_graph.me.send_mail.post.assert_called_once()

    async def test_send_email_with_cc(self, client, mock_graph):
        mock_graph.me.send_mail.post = AsyncMock(return_value=None)
        await client.send_email(
            to=["a@co.com"],
            subject="S",
            body="B",
            cc=["c@co.com"],
        )
        call_args = mock_graph.me.send_mail.post.call_args[0][0]
        assert len(call_args.message.cc_recipients) == 1
        assert call_args.message.cc_recipients[0].email_address.address == "c@co.com"

    async def test_wraps_api_error_as_graph_api_error(self, client, mock_graph):
        from graph.exceptions import GraphAPIError
        from kiota_abstractions.api_error import APIError
        api_err = APIError()
        api_err.response_status_code = 403
        mock_graph.me.send_mail.post = AsyncMock(side_effect=api_err)
        with pytest.raises(GraphAPIError) as exc_info:
            await client.send_email(to=["x@co.com"], subject="S", body="B")
        assert exc_info.value.status_code == 403


class TestListEmails:
    async def test_returns_messages_value(self, client, mock_graph):
        fake_msg = MagicMock()
        mock_result = MagicMock()
        mock_result.value = [fake_msg]
        mock_graph.me.mail_folders.by_mail_folder_id.return_value.messages.get = AsyncMock(
            return_value=mock_result
        )
        result = await client.list_emails()
        assert result == [fake_msg]
        mock_graph.me.mail_folders.by_mail_folder_id.assert_called_once_with("inbox")

    async def test_uses_custom_folder_and_top(self, client, mock_graph):
        mock_result = MagicMock()
        mock_result.value = []
        mock_graph.me.mail_folders.by_mail_folder_id.return_value.messages.get = AsyncMock(
            return_value=mock_result
        )
        await client.list_emails(folder="sentitems", top=10)
        mock_graph.me.mail_folders.by_mail_folder_id.assert_called_once_with("sentitems")
```

- [ ] **Step 2: Run to verify failure**

```bash
uv run pytest tests/test_client.py::TestSendEmail tests/test_client.py::TestListEmails -v
```

Expected: `AttributeError` — `GraphClient` has no `send_email`.

- [ ] **Step 3: Add email methods to `graph/client.py`**

Add these imports at the top of `graph/client.py`:
```python
from msgraph.generated.models.body_type import BodyType
from msgraph.generated.models.email_address import EmailAddress
from msgraph.generated.models.item_body import ItemBody
from msgraph.generated.models.message import Message
from msgraph.generated.models.recipient import Recipient
from msgraph.generated.users.item.send_mail.send_mail_post_request_body import SendMailPostRequestBody
from msgraph.generated.users.item.mail_folders.item.messages.messages_request_builder import (
    MessagesRequestBuilder,
)
from kiota_abstractions.base_request_configuration import RequestConfiguration
```

Add these methods inside `GraphClient`:
```python
    async def send_email(
        self,
        to: list[str],
        subject: str,
        body: str,
        cc: list[str] = None,
        html: bool = True,
    ) -> None:
        message = Message(
            subject=subject,
            body=ItemBody(
                content_type=BodyType.Html if html else BodyType.Text,
                content=body,
            ),
            to_recipients=[
                Recipient(email_address=EmailAddress(address=addr)) for addr in to
            ],
            cc_recipients=[
                Recipient(email_address=EmailAddress(address=addr)) for addr in (cc or [])
            ],
        )
        try:
            await self._graph.me.send_mail.post(SendMailPostRequestBody(message=message))
        except APIError as e:
            raise GraphAPIError(
                status_code=e.response_status_code,
                message=str(e.error.message if e.error else e),
            )

    async def list_emails(
        self,
        folder: str = "inbox",
        top: int = 25,
        filter: str = None,
    ) -> list:
        query_params = MessagesRequestBuilder.MessagesRequestBuilderGetQueryParameters(
            top=top,
            filter=filter,
        )
        config = RequestConfiguration(query_parameters=query_params)
        try:
            result = await self._graph.me.mail_folders.by_mail_folder_id(folder).messages.get(
                request_configuration=config
            )
            return result.value or []
        except APIError as e:
            raise GraphAPIError(
                status_code=e.response_status_code,
                message=str(e.error.message if e.error else e),
            )
```

- [ ] **Step 4: Run tests**

```bash
uv run pytest tests/test_client.py::TestSendEmail tests/test_client.py::TestListEmails -v
```

Expected: 5 passed.

- [ ] **Step 5: Commit**

```bash
git add graph/client.py tests/test_client.py
git commit -m "feat: add send_email and list_emails to GraphClient"
```

---

### Task 7: Calendar Methods — `create_event()` + `get_event_responses()`

**Files:**
- Modify: `graph-integration/graph/client.py`
- Modify: `graph-integration/tests/test_client.py`

- [ ] **Step 1: Write failing tests**

Append to `tests/test_client.py`:
```python
from datetime import datetime, timezone


class TestCreateEvent:
    async def test_posts_event_and_returns_result(self, client, mock_graph):
        fake_event = MagicMock()
        mock_graph.me.events.post = AsyncMock(return_value=fake_event)
        start = datetime(2026, 6, 20, 9, 0, tzinfo=timezone.utc)
        end = datetime(2026, 6, 20, 11, 0, tzinfo=timezone.utc)
        result = await client.create_event(
            subject="Workshop Session 1",
            start=start,
            end=end,
            attendees=["a@co.com", "b@co.com"],
        )
        assert result is fake_event
        mock_graph.me.events.post.assert_called_once()

    async def test_includes_location_when_provided(self, client, mock_graph):
        mock_graph.me.events.post = AsyncMock(return_value=MagicMock())
        start = datetime(2026, 6, 20, 9, 0, tzinfo=timezone.utc)
        end = datetime(2026, 6, 20, 11, 0, tzinfo=timezone.utc)
        await client.create_event(
            subject="S", start=start, end=end, attendees=[], location="HN Room"
        )
        posted_event = mock_graph.me.events.post.call_args[0][0]
        assert posted_event.location.display_name == "HN Room"


class TestGetEventResponses:
    async def test_groups_attendees_by_response_status(self, client, mock_graph):
        def make_attendee(email, status_value):
            a = MagicMock()
            a.email_address.address = email
            a.status.response.value = status_value
            return a

        fake_event = MagicMock()
        fake_event.attendees = [
            make_attendee("a@co.com", "accepted"),
            make_attendee("b@co.com", "declined"),
            make_attendee("c@co.com", "tentativelyAccepted"),
            make_attendee("d@co.com", "none"),
        ]
        mock_graph.me.events.by_event_id.return_value.get = AsyncMock(return_value=fake_event)

        result = await client.get_event_responses("event-id-123")
        assert result == {
            "accepted": ["a@co.com"],
            "declined": ["b@co.com"],
            "tentativelyAccepted": ["c@co.com"],
            "none": ["d@co.com"],
        }

    async def test_returns_empty_lists_when_no_attendees(self, client, mock_graph):
        fake_event = MagicMock()
        fake_event.attendees = []
        mock_graph.me.events.by_event_id.return_value.get = AsyncMock(return_value=fake_event)
        result = await client.get_event_responses("event-id-000")
        assert result == {"accepted": [], "declined": [], "tentativelyAccepted": [], "none": []}
```

- [ ] **Step 2: Run to verify failure**

```bash
uv run pytest tests/test_client.py::TestCreateEvent tests/test_client.py::TestGetEventResponses -v
```

Expected: `AttributeError` — `GraphClient` has no `create_event`.

- [ ] **Step 3: Add calendar imports to `graph/client.py`**

Add to imports section:
```python
from msgraph.generated.models.attendee import Attendee
from msgraph.generated.models.attendee_type import AttendeeType
from msgraph.generated.models.date_time_time_zone import DateTimeTimeZone
from msgraph.generated.models.event import Event
from msgraph.generated.models.location import Location
```

- [ ] **Step 4: Add calendar methods inside `GraphClient`**

```python
    async def create_event(
        self,
        subject: str,
        start: datetime,
        end: datetime,
        attendees: list[str],
        body: str = None,
        location: str = None,
    ):
        event = Event(
            subject=subject,
            start=DateTimeTimeZone(date_time=start.isoformat(), time_zone="UTC"),
            end=DateTimeTimeZone(date_time=end.isoformat(), time_zone="UTC"),
            attendees=[
                Attendee(
                    email_address=EmailAddress(address=addr),
                    type=AttendeeType.Required,
                )
                for addr in attendees
            ],
            body=ItemBody(content_type=BodyType.Html, content=body) if body else None,
            location=Location(display_name=location) if location else None,
        )
        try:
            return await self._graph.me.events.post(event)
        except APIError as e:
            raise GraphAPIError(
                status_code=e.response_status_code,
                message=str(e.error.message if e.error else e),
            )

    async def get_event_responses(self, event_id: str) -> dict:
        try:
            event = await self._graph.me.events.by_event_id(event_id).get()
        except APIError as e:
            raise GraphAPIError(
                status_code=e.response_status_code,
                message=str(e.error.message if e.error else e),
            )
        result: dict[str, list] = {
            "accepted": [],
            "declined": [],
            "tentativelyAccepted": [],
            "none": [],
        }
        for attendee in event.attendees or []:
            status = attendee.status.response.value if attendee.status else "none"
            email = attendee.email_address.address if attendee.email_address else ""
            bucket = status if status in result else "none"
            result[bucket].append(email)
        return result
```

- [ ] **Step 5: Run tests**

```bash
uv run pytest tests/test_client.py::TestCreateEvent tests/test_client.py::TestGetEventResponses -v
```

Expected: 4 passed.

- [ ] **Step 6: Commit**

```bash
git add graph/client.py tests/test_client.py
git commit -m "feat: add create_event and get_event_responses to GraphClient"
```

---

### Task 8: File Methods — `read_onedrive_file()` + `read_sharepoint_file()`

**Files:**
- Modify: `graph-integration/graph/client.py`
- Modify: `graph-integration/tests/test_client.py`

- [ ] **Step 1: Write failing tests**

Append to `tests/test_client.py`:
```python
class TestReadOneDriveFile:
    async def test_returns_bytes_content(self, client, mock_graph):
        fake_bytes = b"file content here"
        mock_graph.me.drive.items.by_drive_item_id.return_value.content.get = AsyncMock(
            return_value=fake_bytes
        )
        result = await client.read_onedrive_file("item-id-abc")
        assert result == fake_bytes
        mock_graph.me.drive.items.by_drive_item_id.assert_called_once_with("item-id-abc")


class TestReadSharePointFile:
    async def test_returns_bytes_content(self, client, mock_graph):
        fake_bytes = b"sharepoint file"
        mock_graph.sites.by_site_id.return_value.drive.items.by_drive_item_id.return_value.content.get = AsyncMock(
            return_value=fake_bytes
        )
        result = await client.read_sharepoint_file(site_id="site-123", item_id="item-456")
        assert result == fake_bytes
        mock_graph.sites.by_site_id.assert_called_once_with("site-123")
```

- [ ] **Step 2: Run to verify failure**

```bash
uv run pytest tests/test_client.py::TestReadOneDriveFile tests/test_client.py::TestReadSharePointFile -v
```

Expected: `AttributeError` — `GraphClient` has no `read_onedrive_file`.

- [ ] **Step 3: Add file methods inside `GraphClient`**

```python
    async def read_onedrive_file(self, item_id: str) -> bytes:
        try:
            return await self._graph.me.drive.items.by_drive_item_id(item_id).content.get()
        except APIError as e:
            raise GraphAPIError(
                status_code=e.response_status_code,
                message=str(e.error.message if e.error else e),
            )

    async def read_sharepoint_file(self, site_id: str, item_id: str) -> bytes:
        try:
            return await (
                self._graph.sites.by_site_id(site_id)
                .drive.items.by_drive_item_id(item_id)
                .content.get()
            )
        except APIError as e:
            raise GraphAPIError(
                status_code=e.response_status_code,
                message=str(e.error.message if e.error else e),
            )
```

- [ ] **Step 4: Run tests**

```bash
uv run pytest tests/test_client.py::TestReadOneDriveFile tests/test_client.py::TestReadSharePointFile -v
```

Expected: 2 passed.

- [ ] **Step 5: Commit**

```bash
git add graph/client.py tests/test_client.py
git commit -m "feat: add read_onedrive_file and read_sharepoint_file to GraphClient"
```

---

### Task 9: Package Export + Full Test Run

**Files:**
- Modify: `graph-integration/graph/__init__.py`

- [ ] **Step 1: Update `graph/__init__.py`**

```python
from graph.client import GraphClient

__all__ = ["GraphClient"]
```

- [ ] **Step 2: Run full test suite**

```bash
uv run pytest tests/ -v
```

Expected: All tests pass (no failures).

- [ ] **Step 3: Smoke test import**

```bash
uv run python -c "from graph import GraphClient; print('OK:', GraphClient)"
```

Expected:
```
OK: <class 'graph.client.GraphClient'>
```

- [ ] **Step 4: Copy `.env.example` to `.env` and fill in real credentials**

```bash
cp .env.example .env
# Edit .env: set CLIENT_SECRET to the real secret
```

**Important:** Also add redirect URI in Azure Portal before running auth for the first time:
- App Registration → Authentication → Add a platform → Web
- Redirect URI: `http://localhost:8000/callback`

- [ ] **Step 5: Final commit**

```bash
git add graph/__init__.py
git commit -m "feat: export GraphClient from graph package"
```

---

## Usage Example (after setup)

```python
import asyncio
from graph import GraphClient

async def main():
    client = GraphClient()  # triggers browser auth on first run

    me = await client.get_me()
    print(f"Logged in as: {me.display_name}")

    await client.send_email(
        to=["nguyen@company.com"],
        subject="Mời tham dự Workshop",
        body="<p>Nội dung AI generate...</p>",
    )

asyncio.run(main())
```
