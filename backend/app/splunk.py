import logging

import httpx

from .core.config import SPLUNK_API_TOKEN, SPLUNK_HEC_TOKEN, SPLUNK_HEC_URL, SPLUNK_URL

LOGGER = logging.getLogger(__name__)

async def push_detection(event: dict) -> bool:
    if not SPLUNK_HEC_URL or not SPLUNK_HEC_TOKEN:
        return False
    try:
        async with httpx.AsyncClient(timeout=8) as client:
            response = await client.post(SPLUNK_HEC_URL, headers={"Authorization": f"Splunk {SPLUNK_HEC_TOKEN}"}, json={"event": event})
            response.raise_for_status()
            return True
    except Exception:
        LOGGER.exception("Splunk HEC push failed")
        return False

async def pull_candidates(query: str) -> list[dict]:
    if not SPLUNK_URL or not SPLUNK_API_TOKEN:
        return []
    try:
        async with httpx.AsyncClient(timeout=8) as client:
            response = await client.post(f"{SPLUNK_URL}/services/search/jobs/export", headers={"Authorization": f"Bearer {SPLUNK_API_TOKEN}"}, data={"search": query, "output_mode": "json"})
            response.raise_for_status()
            return [line for line in response.text.splitlines() if line.strip()]
    except Exception:
        LOGGER.exception("Splunk search failed")
        return []
