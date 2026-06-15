# backend/routers/v1_compose.py
import json
import os
from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
import anthropic
from prompts import build_html_email_prompt
from parser import parse_participants

router = APIRouter(prefix="/api/v1/compose")

client = anthropic.Anthropic(api_key=os.environ.get("ANTHROPIC_API_KEY") or None)

_FILES_BETA = ["files-api-2025-04-14"]


def _strip_base64_prefix(data_url: str) -> tuple[str, str]:
    """Return (media_type, base64_data) from a data URL."""
    if "," in data_url:
        header, data = data_url.split(",", 1)
        media_type = header.split(":")[1].split(";")[0] if ":" in header else "image/png"
    else:
        data, media_type = data_url, "image/png"
    return media_type, data


@router.post("/upload-image")
async def upload_image(file: UploadFile = File(...)):
    """Upload image to Anthropic Files API. Returns file_id — no local storage."""
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(400, "File phải là ảnh")
    data = await file.read()
    response = client.beta.files.upload(
        file=(file.filename or "image.jpg", data, file.content_type),
    )
    return {"file_id": response.id}


class GenerateRequest(BaseModel):
    email_type: str = "invite"
    workshop_context: str = ""
    extra_instructions: str = ""
    file_ids: list[str] = []


@router.post("/generate")
async def generate_email(req: GenerateRequest):
    system_prompt = build_html_email_prompt(
        req.email_type,
        req.workshop_context,
        req.extra_instructions,
    )

    content: list[dict] = [{"type": "text", "text": "Soạn email theo yêu cầu trên."}]
    for file_id in req.file_ids:
        content.append({
            "type": "image",
            "source": {"type": "file", "file_id": file_id},
        })

    msg_kwargs = dict(
        model="claude-opus-4-8",
        max_tokens=4096,
        thinking={"type": "adaptive"},
        system=system_prompt,
        messages=[{"role": "user", "content": content}],
    )

    async def stream():
        stream_ctx = (
            client.beta.messages.stream(**msg_kwargs, betas=_FILES_BETA)
            if req.file_ids
            else client.messages.stream(**msg_kwargs)
        )
        with stream_ctx as s:
            for text in s.text_stream:
                yield f"data: {json.dumps({'chunk': text}, ensure_ascii=False)}\n\n"
        yield f"data: {json.dumps({'done': True})}\n\n"

    return StreamingResponse(
        stream(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


class HistoryMessage(BaseModel):
    role: str
    content: str


class ChatEditRequest(BaseModel):
    current_email: str
    message: str
    history: list[HistoryMessage] = []
    image_data_url: str | None = None


@router.post("/chat-edit")
async def chat_edit(req: ChatEditRequest):
    system_prompt = """Bạn là Toro, Brand Ambassador L&D Zalopay.
Người dùng đưa cho bạn email HTML đã soạn và yêu cầu chỉnh sửa.
Trả về toàn bộ email HTML đã cập nhật với inline CSS đầy đủ như bản gốc.
Chỉ trả về HTML, không giải thích."""

    user_content: list[dict] = [{"type": "text", "text": req.message}]
    if req.image_data_url:
        media_type, data = _strip_base64_prefix(req.image_data_url)
        user_content.append({
            "type": "image",
            "source": {"type": "base64", "media_type": media_type, "data": data},
        })

    messages = [
        {"role": "user", "content": f"Đây là email hiện tại:\n\n{req.current_email}"},
        {"role": "assistant", "content": "Tôi đã xem email. Bạn muốn chỉnh sửa gì?"},
        *[{"role": m.role, "content": m.content} for m in req.history],
        {"role": "user", "content": user_content},
    ]

    async def stream():
        with client.messages.stream(
            model="claude-opus-4-8",
            max_tokens=4096,
            thinking={"type": "adaptive"},
            system=system_prompt,
            messages=messages,
        ) as s:
            for text in s.text_stream:
                yield f"data: {json.dumps({'chunk': text}, ensure_ascii=False)}\n\n"
        yield f"data: {json.dumps({'done': True})}\n\n"

    return StreamingResponse(
        stream(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


@router.post("/send")
async def send_email():
    return {"status": "queued", "message": "Email đã được thêm vào hàng chờ duyệt."}


@router.post("/upload-recipients")
async def upload_recipients(file: UploadFile = File(...)):
    content = await file.read()
    participants = parse_participants(content, file.filename or "upload.xlsx")
    return {"participants": participants, "count": len(participants)}
