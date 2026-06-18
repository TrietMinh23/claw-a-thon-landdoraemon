# Toro Assistant

**Toro Assistant** là hệ thống hỗ trợ L&D Ops tại ZaloPay soạn thảo, cá nhân hóa và gửi email workshop — được xây dựng cho cuộc thi **Greennode Claw-a-thon**.

> **Toro** là Brand Ambassador của bộ phận L&D tại ZaloPay, được tích hợp như một AI assistant giúp soạn email bằng tiếng Việt với giọng văn ấm áp, thân thiện.

---

## Tính năng chính

| Tính năng | Mô tả |
|---|---|
| **Compose Wizard** | Quy trình 5 bước: upload danh sách học viên → điền thông tin workshop → chọn loại email → đính kèm hình ảnh → sinh và xem trước email |
| **AI Email Generation** | Sinh email HTML đầy đủ inline CSS với streaming real-time, dựa trên LLM (Google Gemma 4) và persona của Toro |
| **Chat Edit** | Tinh chỉnh email qua hội thoại, hỗ trợ đính kèm ảnh trong tin nhắn |
| **6 Loại Email** | Mời tham dự, Nhắc nhở 12h, Nhắc nhở 15 phút, Follow-up, Setup phòng (AF/IT), Tùy chỉnh |
| **Duyệt Email** | Hàng chờ duyệt email trước khi gửi; gửi thực qua Microsoft Graph API |
| **RSVP Tracking** | Tạo calendar invite qua Microsoft 365 và theo dõi phản hồi của học viên |
| **Upload Học viên** | Parse file Excel (.xlsx) hoặc CSV danh sách học viên; cá nhân hóa email theo từng người |
| **Image Upload** | Upload ảnh lên VNG Cloud vStorage (S3) để nhúng vào header email |
| **Dashboard** | Thống kê workshop, hàng chờ email, và chat widget Toro hỗ trợ L&D Ops |

---

## Kiến trúc

```
┌─────────────────────────────────────────────────────────────┐
│  Frontend (React + Ant Design + Vite)                       │
│  ├─ Dashboard        ← thống kê + Toro chat widget          │
│  ├─ Compose          ← wizard soạn email 5 bước             │
│  ├─ Email Approval   ← duyệt và gửi email                   │
│  ├─ Workshop         ← quản lý workshop                     │
│  └─ RSVP / Feedback  ← theo dõi phản hồi                   │
└──────────────────────┬──────────────────────────────────────┘
                       │ REST + SSE
┌──────────────────────▼──────────────────────────────────────┐
│  Backend (FastAPI + Python 3.11)                            │
│  ├─ /api/v1/compose    ← sinh email, chat-edit, upload ảnh │
│  ├─ /api/v1/workshops  ← CRUD workshop + invite + RSVP      │
│  ├─ /api/v1/emails     ← duyệt + gửi email                 │
│  ├─ /api/v1/chat       ← Toro chat dashboard                │
│  └─ /api/v1/graph      ← Microsoft Graph auth (device flow) │
└──────────┬─────────────────────────────┬────────────────────┘
           │                             │
┌──────────▼────────┐        ┌───────────▼────────────────────┐
│ VNG Cloud AI MaaS │        │ Microsoft Graph API (M365)     │
│ Google Gemma 4    │        │ ├─ Send email (me/sendMail)     │
│ (OpenAI-compat.)  │        │ ├─ Create event (calendar)     │
└───────────────────┘        │ └─ Get RSVP responses          │
                             └────────────────────────────────┘
           │
┌──────────▼────────┐
│ VNG Cloud vStorage│
│ (S3-compatible)   │
│ Lưu ảnh đính kèm  │
└───────────────────┘
```

---

## Tech Stack

| Layer | Công nghệ |
|---|---|
| Frontend | React 19 + TypeScript, Ant Design 6, React Router 7, Vite 8 |
| Backend | FastAPI 0.115, Python 3.11, uvicorn |
| LLM | Google Gemma 4-31b-it qua VNG Cloud AI Platform (MaaS) |
| Object Storage | VNG Cloud vStorage (S3-compatible, `boto3`) |
| Email & Calendar | Microsoft Graph API (`msgraph-sdk`, `msal`) |
| Auth (Graph) | MSAL Device Code Flow |
| Container | Docker (python:3.11-slim) |

---

## Cài đặt & Chạy

### Yêu cầu

- Python 3.11+
- Node.js 20+
- Tài khoản VNG Cloud AI Platform (lấy `AI_PLATFORM_API_KEY`)
- Azure AD App Registration (lấy `CLIENT_ID`, `TENANT_ID`, `CLIENT_SECRET`)
- VNG Cloud vStorage bucket (lấy S3 credentials)

### 1. Cấu hình môi trường

Tạo file `.env` tại root:

```env
# LLM (VNG Cloud AI Platform)
AI_PLATFORM_API_KEY=<your-key>
LLM_BASE_URL=https://maas-llm-aiplatform-hcm.api.vngcloud.vn/v1
LLM_MODEL=google/gemma-4-31b-it

# VNG Cloud vStorage (S3-compatible)
S3_ENDPOINT=
S3_BUCKET=<your-bucket>
S3_ACCESS_KEY=<your-access-key>
S3_SECRET_KEY=<your-secret-key>

# Microsoft Azure AD (để gửi email + tạo calendar invite)
CLIENT_ID=<azure-app-client-id>
TENANT_ID=<azure-tenant-id>
CLIENT_SECRET=<azure-client-secret>

# Đặt thành false để gửi email thật qua Graph API
MOCK_EMAIL_SEND=true
```

### 2. Backend

```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

Backend chạy tại `http://localhost:8000`. Swagger UI tại `http://localhost:8000/docs`.

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend chạy tại `http://localhost:5173` và proxy API về backend.

### 4. Docker (Production)

```bash
docker build -t toro-mail-composer .
docker run -p 8080:8080 --env-file .env toro-mail-composer
```

---

## API Overview

### Compose

| Method | Endpoint | Mô tả |
|---|---|---|
| `POST` | `/api/v1/compose/generate` | Sinh email HTML (SSE streaming) |
| `POST` | `/api/v1/compose/chat-edit` | Chỉnh sửa email qua hội thoại (SSE) |
| `POST` | `/api/v1/compose/upload-image` | Upload ảnh lên S3, trả về URL |
| `POST` | `/api/v1/compose/upload-recipients` | Parse file Excel/CSV học viên |

### Workshops

| Method | Endpoint | Mô tả |
|---|---|---|
| `GET` | `/api/v1/workshops` | Danh sách workshop |
| `GET` | `/api/v1/workshops/{id}/attendees` | Danh sách học viên |
| `POST` | `/api/v1/workshops/{id}/invite` | Tạo calendar invite Microsoft 365 |
| `GET` | `/api/v1/workshops/{id}/rsvp` | Lấy phản hồi RSVP |
| `POST` | `/api/v1/workshops/{id}/remind` | Gửi email nhắc nhở người chưa phản hồi |

### Emails

| Method | Endpoint | Mô tả |
|---|---|---|
| `GET` | `/api/v1/emails` | Danh sách email drafts |
| `POST` | `/api/v1/emails` | Tạo email draft mới |
| `PUT` | `/api/v1/emails/{id}/approve` | Duyệt và gửi email |

### Graph Auth (Microsoft 365)

| Method | Endpoint | Mô tả |
|---|---|---|
| `GET` | `/api/v1/graph/auth/status` | Kiểm tra trạng thái xác thực |
| `POST` | `/api/v1/graph/auth/start` | Khởi tạo Device Code Flow |
| `POST` | `/api/v1/graph/auth/poll` | Kiểm tra kết quả xác thực |
| `DELETE` | `/api/v1/graph/auth/logout` | Đăng xuất |

---

## Luồng soạn email (Compose Wizard)

```
Bước 1: Học viên
  └─ Chọn workshop hoặc upload file Excel/CSV danh sách học viên

Bước 2: Nội dung
  └─ Nhập tên chương trình, ngày giờ, địa điểm, tên PIC, ghi chú

Bước 3: Loại email
  └─ Chọn: Mời tham dự / Nhắc 12h / Nhắc 15 phút / Follow-up / Setup phòng / Tùy chỉnh
  └─ Nhập hướng dẫn bổ sung cho AI

Bước 4: Hình ảnh
  └─ Upload ảnh (drag & drop), tự động lưu lên S3

Bước 5: Kết quả
  └─ AI sinh email HTML streaming
  └─ Xem trước email, chỉnh sửa qua chat với Toro
  └─ Gửi vào hàng chờ duyệt
```

---

## Xác thực Microsoft 365

Để gửi email thật và tạo calendar invite, cần xác thực qua **MSAL Device Code Flow**:

1. Gọi `POST /api/v1/graph/auth/start` → nhận `user_code` và `verification_uri`
2. Mở `verification_uri` trên browser, nhập `user_code`
3. Poll `POST /api/v1/graph/auth/poll` đến khi `done: true`
4. Token được lưu vào `token_cache.json`

Trên giao diện, nút **Kết nối Microsoft 365** trong sidebar hỗ trợ luồng này.

---

## Cấu trúc thư mục

```
.
├── backend/
│   ├── main.py              ← FastAPI app + legacy /api/* endpoints
│   ├── prompts.py           ← System prompts và email samples cho Toro
│   ├── parser.py            ← Parse file Excel/CSV học viên
│   ├── mock_data.py         ← Dữ liệu mẫu workshop, email drafts
│   ├── routers/
│   │   ├── v1_compose.py    ← Compose, chat-edit, upload
│   │   ├── v1_workshops.py  ← Workshop CRUD, invite, RSVP, remind
│   │   ├── v1_emails.py     ← Email approval queue
│   │   └── v1_graph.py      ← Microsoft Graph auth
│   ├── graph/
│   │   ├── client.py        ← GraphClient wrapper (send_email, create_event, RSVP)
│   │   ├── auth.py          ← MSAL token management
│   │   └── exceptions.py    ← AuthError, GraphAPIError
│   ├── services/
│   │   └── graph_service.py ← Singleton Graph client + device flow state machine
│   └── tests/               ← pytest test suite
├── frontend/
│   └── src/
│       ├── App.tsx           ← React Router routes
│       ├── api.ts            ← API client (fetch + SSE streaming)
│       ├── types.ts          ← TypeScript types
│       └── components/
│           ├── layout/       ← AppLayout, Sidebar
│           ├── dashboard/    ← DashboardPage + Toro chat widget
│           ├── compose/      ← ComposePage wizard + sub-components
│           ├── emails/       ← EmailApprovalPage
│           ├── workshop/     ← WorkshopPage
│           ├── rsvp/         ← RSVPPage
│           └── shared/       ← ChatPanel, EmailPreview, GraphAuthModal
├── artifact/                 ← Email templates mẫu, mock data Excel
├── mockup/                   ← HTML mockups giao diện
├── Dockerfile
└── .env                      ← Cấu hình (không commit lên git)
```

---

## Phát triển & Test

```bash
# Chạy test backend
cd backend
pytest tests/ -v

# Type check frontend
cd frontend
npx tsc --noEmit
```

---

## Tài khoản đăng nhập 

| Trường | Giá trị |
|---|---|
| **Email** | `ld@zalopay.vn` hoặc `admin@zalopay.vn` |
| **Password** | `Toro@2026` |

---

## Nhóm phát triển

Dự án được xây dựng trong khuôn khổ **Greennode Claw-a-thon** bởi team **L&Doraemon**.
