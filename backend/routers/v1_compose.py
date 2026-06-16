# backend/routers/v1_compose.py
import asyncio
import io
import json
import os
import uuid
from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from openai import AsyncOpenAI
import boto3
from botocore.client import Config
from prompts import build_html_email_prompt
from parser import parse_participants

router = APIRouter(prefix="/api/v1/compose")

LLM_BASE_URL = os.environ.get("LLM_BASE_URL", "https://maas-llm-aiplatform-hcm.api.vngcloud.vn/v1")
LLM_MODEL = os.environ.get("LLM_MODEL", "google/gemma-4-31b-it")

S3_ENDPOINT = os.environ.get("S3_ENDPOINT", "https://han02.vstorage.vngcloud.vn")
S3_BUCKET = os.environ.get("S3_BUCKET", "aaaaaa")
S3_ACCESS_KEY = os.environ.get("S3_ACCESS_KEY")
S3_SECRET_KEY = os.environ.get("S3_SECRET_KEY")


def make_client() -> AsyncOpenAI:
    return AsyncOpenAI(
        api_key=os.environ["AI_PLATFORM_API_KEY"],
        base_url=LLM_BASE_URL,
    )


def _make_s3():
    return boto3.client(
        "s3",
        endpoint_url=S3_ENDPOINT,
        aws_access_key_id=S3_ACCESS_KEY,
        aws_secret_access_key=S3_SECRET_KEY,
        region_name="han02",
        config=Config(signature_version="s3v4"),
    )


async def _upload_to_s3(data: bytes, key: str, content_type: str) -> str:
    def _sync():
        s3 = _make_s3()
        s3.upload_fileobj(
            io.BytesIO(data),
            S3_BUCKET,
            key,
            ExtraArgs={"ContentType": content_type, "ACL": "public-read"},
        )

    await asyncio.to_thread(_sync)
    return f"{S3_ENDPOINT}/{S3_BUCKET}/{key}"


@router.post("/upload-image")
async def upload_image(file: UploadFile = File(...)):
    """Upload image to S3 and return a public URL."""
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(400, "File phải là ảnh")
    ext = (file.filename or "image.jpg").rsplit(".", 1)[-1]
    key = f"uploads/{uuid.uuid4()}.{ext}"
    data = await file.read()
    try:
        url = await _upload_to_s3(data, key, file.content_type)
    except Exception as e:
        raise HTTPException(500, f"Upload S3 thất bại: {e}")
    return {"file_id": key, "url": url}


class GenerateRequest(BaseModel):
    email_type: str = "invite"
    workshop_context: str = ""
    extra_instructions: str = ""
    file_ids: list[str] = []
    image_urls: list[str] = []


@router.post("/generate")
async def generate_email(req: GenerateRequest):
    client = make_client()

    # Reconstruct S3 URLs from file_ids; merge with any direct image_urls
    all_urls = list(req.image_urls)
    for key in req.file_ids:
        all_urls.append(f"{S3_ENDPOINT}/{S3_BUCKET}/{key}")

    system_prompt = build_html_email_prompt(
        req.email_type,
        req.workshop_context,
        req.extra_instructions,
        image_urls=all_urls or None,
    )

    user_content: list[dict] = [{"type": "text", "text": "Soạn email theo yêu cầu trên."}]

    async def stream():
        response = await client.chat.completions.create(
            model=LLM_MODEL,
            max_tokens=4096,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_content},
            ],
            stream=True,
        )
        async for chunk in response:
            text = chunk.choices[0].delta.content or ""
            if text:
                yield f"data: {json.dumps({'chunk': text}, ensure_ascii=False)}\n\n"
            if chunk.choices[0].finish_reason is not None:
                break
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
    image_url: str | None = None


@router.post("/chat-edit")
async def chat_edit(req: ChatEditRequest):
    client = make_client()
    system_prompt = """Bạn là Toro, Brand Ambassador L&D Zalopay.
Người dùng đưa cho bạn email HTML đã soạn và yêu cầu chỉnh sửa.
QUAN TRỌNG: Chỉ trả về toàn bộ nội dung HTML email đã chỉnh sửa, bắt đầu bằng <div và kết thúc bằng </div>.
Giữ nguyên toàn bộ inline CSS. Không thêm bất kỳ giải thích, lời chào, hay văn bản nào ngoài HTML."""

    user_content: list[dict] = [{"type": "text", "text": req.message}]
    # Prefer S3 URL over base64 data URL
    img_url = req.image_url or req.image_data_url
    if img_url:
        user_content.append({
            "type": "image_url",
            "image_url": {"url": img_url},
        })

    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": f"Đây là email hiện tại:\n\n{req.current_email}"},
        {"role": "assistant", "content": "Tôi đã xem email. Bạn muốn chỉnh sửa gì?"},
        *[{"role": m.role, "content": m.content} for m in req.history],
        {"role": "user", "content": user_content},
    ]

    async def stream():
        response = await client.chat.completions.create(
            model=LLM_MODEL,
            max_tokens=4096,
            messages=messages,
            stream=True,
        )
        async for chunk in response:
            text = chunk.choices[0].delta.content or ""
            if text:
                yield f"data: {json.dumps({'chunk': text}, ensure_ascii=False)}\n\n"
            if chunk.choices[0].finish_reason is not None:
                break
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
