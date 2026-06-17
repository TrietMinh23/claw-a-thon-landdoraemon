import json
import os
from contextlib import asynccontextmanager
from openai import AsyncOpenAI
from dotenv import load_dotenv, find_dotenv
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

load_dotenv(find_dotenv())
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from prompts import build_system_prompt
from parser import parse_participants
from routers.v1_workshops import router as workshops_router
from routers.v1_emails import router as emails_router
from routers.v1_compose import router as compose_router
from routers.v1_graph import router as graph_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        import services.graph_service as graph_service
        graph_service.get_client()
    except Exception:
        pass
    yield


app = FastAPI(title="Toro Mail Composer", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(workshops_router)
app.include_router(emails_router)
app.include_router(compose_router)
app.include_router(graph_router)

LLM_BASE_URL = os.environ.get("LLM_BASE_URL", "https://maas-llm-aiplatform-hcm.api.vngcloud.vn/v1")
LLM_MODEL = os.environ.get("LLM_MODEL", "google/gemma-4-31b-it")


def make_client() -> AsyncOpenAI:
    return AsyncOpenAI(
        api_key=os.environ["AI_PLATFORM_API_KEY"],
        base_url=LLM_BASE_URL,
    )


class GenerateRequest(BaseModel):
    email_type: str
    program_name: str = ""
    purpose: str = ""
    datetime: str = ""
    location: str = ""
    description: str = ""


@app.post("/api/generate")
async def generate_email(req: GenerateRequest):
    client = make_client()
    system_prompt = build_system_prompt(
        req.email_type,
        program_name=req.program_name,
        purpose=req.purpose,
        datetime=req.datetime,
        location=req.location,
        description=req.description,
    )

    async def stream():
        response = await client.chat.completions.create(
            model=LLM_MODEL,
            max_tokens=2048,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": "Soạn email theo yêu cầu trên."},
            ],
            stream=True,
        )
        async for chunk in response:
            if not chunk.choices:
                continue
            text = chunk.choices[0].delta.content or ""
            if text:
                yield f"data: {json.dumps({'chunk': text}, ensure_ascii=False)}\n\n"
        yield f"data: {json.dumps({'done': True})}\n\n"

    return StreamingResponse(
        stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )


class ChatMessage(BaseModel):
    role: str
    content: str


class RefineRequest(BaseModel):
    current_email: str
    message: str
    history: list[ChatMessage] = []


@app.post("/api/refine")
async def refine_email(req: RefineRequest):
    client = make_client()

    system_prompt = """Bạn là Toro, Brand Ambassador của L&D tại Zalopay.
Người dùng sẽ đưa cho bạn một email HTML đã soạn và yêu cầu chỉnh sửa.
Trả về toàn bộ nội dung email đã chỉnh sửa dưới dạng HTML hợp lệ.
Chỉ dùng các tag: <p>, <strong>, <em>, <ul>, <li>, <br>.
Không dùng <html>, <head>, <body>, hoặc inline CSS. Chỉ trả về HTML, không giải thích."""

    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": f"Đây là email hiện tại:\n\n{req.current_email}"},
        {"role": "assistant", "content": "Tôi đã xem email. Bạn muốn chỉnh sửa gì?"},
    ]
    for msg in req.history:
        messages.append({"role": msg.role, "content": msg.content})
    messages.append({"role": "user", "content": req.message})

    async def stream():
        response = await client.chat.completions.create(
            model=LLM_MODEL,
            max_tokens=2048,
            messages=messages,
            stream=True,
        )
        async for chunk in response:
            if not chunk.choices:
                continue
            text = chunk.choices[0].delta.content or ""
            if text:
                yield f"data: {json.dumps({'chunk': text}, ensure_ascii=False)}\n\n"
        yield f"data: {json.dumps({'done': True})}\n\n"

    return StreamingResponse(
        stream(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


@app.post("/api/parse-participants")
async def parse_participants_endpoint(file: UploadFile = File(...)):
    if not file.filename:
        raise HTTPException(400, "No file provided")
    allowed = {".xlsx", ".xls", ".csv"}
    ext = "." + file.filename.rsplit(".", 1)[-1].lower() if "." in file.filename else ""
    if ext not in allowed:
        raise HTTPException(400, f"File type {ext} not supported. Use .xlsx or .csv")
    content = await file.read()
    participants = parse_participants(content, file.filename)
    return {"participants": participants, "count": len(participants)}


class DashboardChatMessage(BaseModel):
    role: str
    content: str

class DashboardChatRequest(BaseModel):
    messages: list[DashboardChatMessage]

@app.post("/api/v1/chat")
async def dashboard_chat(req: DashboardChatRequest):
    from mock_data import WORKSHOPS, EMAIL_DRAFTS, ATTENDEES

    ctx = []
    ctx.append("=== DANH SÁCH WORKSHOP ===")
    for w in WORKSHOPS:
        r = w["rsvp"]
        ctx.append(
            f"- {w['name']} | status={w['status']} | tiến độ={w['progress']}% | ngày={w['dates']} | phòng={w['room']} | "
            f"tổng={w['total']} HV | sessions={w['sessions']} | "
            f"RSVP: accept={r['accept']}, decline={r['decline']}, tentative={r['tentative']}, chưa phản hồi={r['none']}"
        )

    pending = [e for e in EMAIL_DRAFTS if e["status"] == "pending"]
    ctx.append(f"\n=== EMAIL CHỜ DUYỆT ({len(pending)}) ===")
    for e in pending:
        ctx.append(f"- {e['label']} | ngày gửi={e['date']} | {e['count']} người nhận")

    ctx.append(f"\n=== HỌC VIÊN ===")
    for a in ATTENDEES:
        ctx.append(f"- {a['name']} ({a['email']}) | BU={a['bu']} | session={a['session']} | rsvp={a['rsvp']}")

    system_prompt = (
        "Bạn là Toro, Brand Ambassador của L&D team tại Zalopay. "
        "Hỗ trợ L&D Ops quản lý workshop, theo dõi RSVP, duyệt email. "
        "Trả lời ngắn gọn, thân thiện bằng tiếng Việt.\n\n"
        "Dữ liệu hệ thống hiện tại:\n" + "\n".join(ctx)
    )

    client = make_client()
    messages = [{"role": "system", "content": system_prompt}]
    for m in req.messages:
        messages.append({"role": m.role, "content": m.content})

    async def stream():
        response = await client.chat.completions.create(
            model=LLM_MODEL,
            max_tokens=512,
            messages=messages,
            stream=True,
        )
        async for chunk in response:
            if not chunk.choices:
                continue
            text = chunk.choices[0].delta.content or ""
            if text:
                yield f"data: {json.dumps({'chunk': text}, ensure_ascii=False)}\n\n"
        yield f"data: {json.dumps({'done': True})}\n\n"

    return StreamingResponse(
        stream(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


@app.get("/health")
def health():
    return {"status": "ok"}


# Serve React frontend static files (only if built static/ dir exists)
_static_dir = os.path.join(os.path.dirname(__file__), "static")
if os.path.isdir(_static_dir):
    app.mount("/assets", StaticFiles(directory=os.path.join(_static_dir, "assets")), name="assets")

    @app.get("/{full_path:path}", include_in_schema=False)
    def serve_spa(full_path: str):
        file_path = os.path.join(_static_dir, full_path)
        if full_path and os.path.isfile(file_path):
            return FileResponse(file_path)
        return FileResponse(os.path.join(_static_dir, "index.html"))


class ParticipantData(BaseModel):
    no: str = ""
    name: str = ""
    email: str = ""
    dept: str = ""
    group: str = ""
    hrbp: str = ""
    session: str = ""
    title: str = ""
    line_manager: str = ""


class PersonalizeRequest(BaseModel):
    email_template: str
    participants: list[ParticipantData]


@app.post("/api/personalize")
async def personalize_emails(req: PersonalizeRequest):
    results = []
    for p in req.participants:
        body = req.email_template
        body = body.replace("{{HO_TEN_HV}}", p.name)
        body = body.replace("{{TEN_HRBP}}", p.hrbp)
        body = body.replace("{{PHONG_BAN}}", p.dept)
        results.append({"name": p.name, "email": p.email, "body": body})
    return {"emails": results}
