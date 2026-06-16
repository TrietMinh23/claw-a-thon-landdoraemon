# backend/routers/v1_graph.py
from fastapi import APIRouter, HTTPException
import services.graph_service as graph_service
from graph.exceptions import AuthError

router = APIRouter(prefix="/api/v1/graph")


@router.get("/auth/status")
async def auth_status():
    if not graph_service.is_authenticated():
        return {"authenticated": False, "user_display_name": None, "user_email": None}
    try:
        client = graph_service.get_client()
        me = await client.get_me()
        return {
            "authenticated": True,
            "user_display_name": me.display_name,
            "user_email": me.mail,
        }
    except Exception:
        return {"authenticated": True, "user_display_name": None, "user_email": None}


@router.post("/auth/start")
def auth_start():
    try:
        return graph_service.start_device_flow()
    except AuthError as e:
        raise HTTPException(502, str(e))


@router.post("/auth/poll")
def auth_poll():
    try:
        done = graph_service.poll_device_flow()
        return {"done": done}
    except AuthError as e:
        raise HTTPException(400, str(e))


@router.delete("/auth/logout")
def auth_logout():
    graph_service.reset_client()
    return {"status": "logged out"}
