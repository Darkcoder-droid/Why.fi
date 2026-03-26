import asyncio
import base64
import os
from pathlib import Path
from uuid import uuid4

from fastapi import FastAPI, HTTPException, Request, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

try:
    from .ml_engine import FaceAnalyzer
except ImportError:
    from ml_engine import FaceAnalyzer

CAPTURES_DIR = Path(__file__).resolve().parent / "captures"
CAPTURES_DIR.mkdir(exist_ok=True)

analyzer = FaceAnalyzer()


def _get_allowed_origins() -> list[str]:
    configured_origins = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        os.getenv("FRONTEND_ORIGIN", "").strip(),
        os.getenv("VERCEL_PROJECT_PRODUCTION_URL", "").strip(),
    ]
    origins: list[str] = []

    for origin in configured_origins:
        if not origin:
            continue
        normalized = origin if "://" in origin else f"https://{origin}"
        if normalized not in origins:
            origins.append(normalized)

    return origins


def create_app() -> FastAPI:
    application = FastAPI(title="why.fi backend")
    application.add_middleware(
        CORSMiddleware,
        allow_origins=_get_allowed_origins(),
        allow_origin_regex=r"http://.*:5173",
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    application.mount("/images", StaticFiles(directory=CAPTURES_DIR), name="captures")
    application.mount("/api/images", StaticFiles(directory=CAPTURES_DIR), name="api-captures")
    return application


app = create_app()


class CapturePayload(BaseModel):
    image: str
    expression: str
    score: int


@app.get("/health")
@app.get("/api/health")
def health():
    analyzer_status = analyzer.get_status()
    return {
        "status": "ok" if analyzer_status["ready"] else "degraded",
        "analyzer": analyzer_status,
    }


@app.post("/captures")
@app.post("/api/captures")
async def save_capture(payload: CapturePayload, request: Request):
    if not payload.image:
        raise HTTPException(status_code=400, detail="Missing image data")

    image_data = payload.image.split(",", 1)[1] if "," in payload.image else payload.image

    try:
        file_bytes = base64.b64decode(image_data)
    except Exception as exc:
        raise HTTPException(status_code=400, detail="Invalid image data") from exc

    safe_expression = "".join(ch for ch in payload.expression.lower() if ch.isalnum() or ch in {"-", "_"})
    filename = f"{payload.score:02d}-{safe_expression or 'capture'}-{uuid4().hex[:8]}.jpg"
    output_path = CAPTURES_DIR / filename
    output_path.write_bytes(file_bytes)
    image_url = request.url_for("api-captures", path=filename)

    return {
        "filename": filename,
        "url": str(image_url),
    }

@app.websocket("/ws")
@app.websocket("/api/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            data = await websocket.receive_text()
            # Process frame asynchronously to avoid blocking the event loop
            result = await asyncio.to_thread(analyzer.process_frame, data)
            if result:
                await websocket.send_json(result)
            else:
                await websocket.send_json({"emoji": "none", "why_meter": {"why_score": 0, "boredom": 0, "confusion": 0, "dread": 0}})
    except WebSocketDisconnect:
        pass
