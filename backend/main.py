import json
import os
import anthropic
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from prompts import build_system_prompt
from parser import parse_participants
from routers.v1_workshops import router as workshops_router
from routers.v1_emails import router as emails_router
from routers.v1_compose import router as compose_router

app = FastAPI(title="Toro Mail Composer")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(workshops_router)
app.include_router(emails_router)
app.include_router(compose_router)


class GenerateRequest(BaseModel):
    email_type: str
    program_name: str = ""
    purpose: str = ""
    datetime: str = ""
    location: str = ""
    description: str = ""


@app.post("/api/generate")
async def generate_email(req: GenerateRequest):
    client = anthropic.Anthropic(api_key=os.environ["ANTHROPIC_API_KEY"])
    system_prompt = build_system_prompt(
        req.email_type,
        program_name=req.program_name,
        purpose=req.purpose,
        datetime=req.datetime,
        location=req.location,
        description=req.description,
    )

    async def stream():
        with client.messages.stream(
            model="claude-opus-4-8",
            max_tokens=2048,
            thinking={"type": "adaptive"},
            system=system_prompt,
            messages=[{"role": "user", "content": "Soạn email theo yêu cầu trên."}],
        ) as s:
            for text in s.text_stream:
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
    role: str  # "user" or "assistant"
    content: str


class RefineRequest(BaseModel):
    current_email: str
    message: str
    history: list[ChatMessage] = []


@app.post("/api/refine")
async def refine_email(req: RefineRequest):
    client = anthropic.Anthropic(api_key=os.environ["ANTHROPIC_API_KEY"])

    system_prompt = """Bạn là Toro, Brand Ambassador của L&D tại Zalopay.
Người dùng sẽ đưa cho bạn một email HTML đã soạn và yêu cầu chỉnh sửa.
Trả về toàn bộ nội dung email đã chỉnh sửa dưới dạng HTML hợp lệ.
Chỉ dùng các tag: <p>, <strong>, <em>, <ul>, <li>, <br>.
Không dùng <html>, <head>, <body>, hoặc inline CSS. Chỉ trả về HTML, không giải thích."""

    messages = []
    # Seed with current email as first user/assistant exchange
    messages.append({
        "role": "user",
        "content": f"Đây là email hiện tại:\n\n{req.current_email}"
    })
    messages.append({
        "role": "assistant",
        "content": "Tôi đã xem email. Bạn muốn chỉnh sửa gì?"
    })

    # Append chat history
    for msg in req.history:
        messages.append({"role": msg.role, "content": msg.content})

    # Append current user message
    messages.append({"role": "user", "content": req.message})

    async def stream():
        with client.messages.stream(
            model="claude-opus-4-8",
            max_tokens=2048,
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


@app.get("/health")
def health():
    return {"status": "ok"}


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
