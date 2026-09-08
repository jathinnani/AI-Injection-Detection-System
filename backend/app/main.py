import logging
from collections import deque
from datetime import datetime, timezone
from pathlib import Path

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.core.rate_limit import limiter
from app.ml.inference import detector
from app.schemas.detection import BatchDetectionRequest, DetectionRequest, DetectionResponse

logging.basicConfig(level=logging.INFO)
app = FastAPI(title="AegisAI InjectionGuard API", version="1.0.0")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["GET", "POST"], allow_headers=["*"])
recent = deque(maxlen=100)
FRONTEND_DIR = Path(__file__).resolve().parents[2] / "frontend"

@app.get("/api/health")
async def health() -> dict[str, str]:
    return {"status": "ok", "service": "InjectionGuard AI"}

@app.post("/api/detect", response_model=DetectionResponse)
async def detect(payload: DetectionRequest, request: Request) -> DetectionResponse:
    if not limiter.allow(request.client.host if request.client else "unknown"):
        raise HTTPException(status_code=429, detail="Too many requests. Please retry later.")
    result = detector.detect(payload.input)
    recent.appendleft({**result.model_dump(), "time": datetime.now(timezone.utc).isoformat()})
    return result

@app.post("/api/detect/batch", response_model=list[DetectionResponse])
async def detect_batch(payload: BatchDetectionRequest, request: Request) -> list[DetectionResponse]:
    if not limiter.allow(request.client.host if request.client else "unknown"):
        raise HTTPException(status_code=429, detail="Too many requests. Please retry later.")
    results = [detector.detect(value) for value in payload.inputs]
    for result in reversed(results):
        recent.appendleft({**result.model_dump(), "time": datetime.now(timezone.utc).isoformat()})
    return results

@app.get("/api/dashboard/summary")
async def dashboard_summary() -> dict:
    malicious = [item for item in recent if item["prediction"] == "malicious"]
    return {"total_detections": len(recent), "active_monitors": 1, "blocked_attempts": len(malicious), "system_load": "simulated", "status": "simulated", "estimated_fields": ["active_monitors", "system_load"]}

@app.get("/api/dashboard/alerts")
async def dashboard_alerts() -> dict:
    return {"alerts": list(recent)[:50], "status": "simulated"}


if FRONTEND_DIR.exists():
    app.mount("/", StaticFiles(directory=FRONTEND_DIR, html=True), name="frontend")
