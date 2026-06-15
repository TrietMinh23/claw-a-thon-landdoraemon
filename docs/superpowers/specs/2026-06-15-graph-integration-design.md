# Microsoft Graph Integration — L&D Automation

**Date:** 2026-06-15
**Scope:** Python package để gửi email, đọc email, quản lý calendar events, đọc file từ OneDrive/SharePoint — phục vụ luồng tự động hóa L&D.

---

## Context

Dự án L&D Ops Assistant tự động hóa luồng workshop: gửi email mời, theo dõi RSVP, tạo calendar event. Phần AI generate nội dung email do thành viên khác đảm nhiệm. Package này cung cấp lớp transport/storage: nhận nội dung từ AI agent rồi gửi qua Microsoft Graph API.

Azure AD app registration đã được cấu hình sẵn với tất cả permissions (Delegated, đã grant admin consent).

---

## Package Structure

```
graph/
├── __init__.py       # re-export GraphClient
├── auth.py           # MSAL + Authorization Code Flow + token cache
└── client.py         # GraphClient — thin wrapper over msgraph-sdk-python

.env                  # credentials (không commit)
.env.example          # template
pyproject.toml        # uv-managed dependencies
token_cache.json      # MSAL token cache (không commit)
```

---

## Auth Design (`auth.py`)

**Flow:** OAuth2 Authorization Code với localhost callback.

```
Lần đầu:
  load_token_cache() → không có cache
  → mở browser: https://login.microsoftonline.com/{tenant}/oauth2/v2.0/authorize
  → user login Microsoft
  → redirect về http://localhost:8000/callback?code=...
  → MSAL exchange code → access token + refresh token
  → serialize cache → token_cache.json

Các lần sau:
  load_token_cache() → có cache
  → msal.acquire_token_silent() → check expiry
  → nếu hết hạn: tự dùng refresh token → access token mới
  → save cache lại
  → ready (không cần user)
```

**Token cache:** Dùng `msal.SerializableTokenCache` — serialize/deserialize JSON. Lưu vào đường dẫn cấu hình qua `TOKEN_CACHE_PATH` trong `.env`.

**Callback server:** `http.server` từ stdlib Python — không cần thêm dependency. Mở trên port 8000, lắng nghe 1 request duy nhất rồi tắt.

**Scopes:**
```python
SCOPES = [
    "Mail.Send",
    "Mail.ReadWrite",
    "Calendars.ReadWrite",
    "User.Read",
    "Files.Read.All",
    "Sites.Read.All",
    "offline_access",
]
```

---

## Client Design (`client.py`)

`GraphClient` là thin wrapper over `msgraph-sdk-python`. Khởi tạo nhận token provider từ `auth.py`.

### Methods

| Method | Signature | Permission |
|---|---|---|
| `get_me()` | `async get_me() -> User` | User.Read |
| `send_email()` | `async send_email(to: list[str], subject: str, body: str, cc: list[str] = None, html: bool = True)` | Mail.Send |
| `list_emails()` | `async list_emails(folder: str = "inbox", top: int = 25, filter: str = None) -> list[Message]` | Mail.ReadWrite |
| `create_event()` | `async create_event(subject: str, start: datetime, end: datetime, attendees: list[str], body: str = None, location: str = None) -> Event` | Calendars.ReadWrite |
| `get_event_responses()` | `async get_event_responses(event_id: str) -> dict` | Calendars.ReadWrite |
| `read_onedrive_file()` | `async read_onedrive_file(item_id: str) -> bytes` | Files.Read.All |
| `read_sharepoint_file()` | `async read_sharepoint_file(site_id: str, item_id: str) -> bytes` | Sites.Read.All |

`get_event_responses()` trả về dict dạng:
```python
{"accepted": [...], "declined": [...], "tentativelyAccepted": [...], "none": [...]}
```

### Caller Pattern

```python
from graph import GraphClient

client = GraphClient()  # tự động auth nếu chưa có token

await client.send_email(
    to=["nguyen@company.com"],
    subject="Mời tham dự Workshop",
    body="<p>Nội dung AI generate...</p>",
)

responses = await client.get_event_responses("event-id-123")
# {"accepted": ["a@co.com"], "declined": ["b@co.com"], ...}
```

---

## Error Handling

3 exception types được định nghĩa trong `graph/exceptions.py`:

| Exception | Khi nào | Hành động |
|---|---|---|
| `AuthError` | Refresh token fail, user bị revoke | Raise rõ — caller phải trigger re-auth |
| `GraphAPIError` | 4xx/5xx từ Graph API | Wrap lại với `status_code` + `message` gốc |
| `TokenCacheError` | Cache file corrupt/không đọc được | Xóa cache, raise — caller phải re-auth |

Không tự retry — `msgraph-sdk-python` đã handle 429 (rate limit) và 503 (service unavailable) internally.

---

## Dependencies

```toml
[project]
name = "graph-integration"
dependencies = [
    "msgraph-sdk>=1.0",
    "msal>=1.0",
    "python-dotenv>=1.0",
]
```

Setup:
```bash
uv init graph-integration
cd graph-integration
uv add msgraph-sdk msal python-dotenv
```

---

## Environment Variables

`.env.example`:
```
CLIENT_ID=059231f1-a801-4313-933c-3a0c06964b39
TENANT_ID=7c112a6e-10e2-4e09-afc4-2e37bc60d821
CLIENT_SECRET=<your-secret>
REDIRECT_URI=http://localhost:8000/callback
TOKEN_CACHE_PATH=token_cache.json
```

---

## Azure Portal Setup (1 bước còn thiếu)

Vào **App Registration → Authentication → Add a platform → Web**, thêm redirect URI:
```
http://localhost:8000/callback
```
Nếu không có bước này, Authorization Code Flow sẽ bị lỗi `AADSTS50011`.

---

## Out of Scope

- Retry logic tùy chỉnh (đã có trong SDK)
- Gửi attachment (có thể thêm sau)
- Multi-user / multi-tenant (1 user account duy nhất cho agent)
- Webhook / push notification cho email mới
