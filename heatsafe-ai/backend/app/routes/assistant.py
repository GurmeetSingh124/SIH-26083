import httpx
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.config import settings

router = APIRouter(prefix="/assistant", tags=["Assistant"])


class AssistantRequest(BaseModel):
    question: str = Field(min_length=1, max_length=1000)
    risk: dict | None = None
    weather: dict | None = None


@router.post("/chat")
async def chat_with_gemini(payload: AssistantRequest):
    if not settings.GEMINI_API_KEY:
        raise HTTPException(status_code=503, detail="Gemini API key is not configured")

    system_prompt = (
        "You are HeatSafe AI, a concise heat-safety assistant. "
        "Answer in the user's language when possible. Use only the supplied live context, "
        "give practical safety advice, and never diagnose medical conditions. "
        "If risk is High or Extreme, clearly recommend avoiding heat exposure and seeking help for symptoms."
    )
    context = {
        "risk": payload.risk or {},
        "weather": payload.weather or {},
    }
    request_body = {
        "systemInstruction": {"parts": [{"text": system_prompt}]},
        "contents": [{
            "role": "user",
            "parts": [{"text": f"Live context: {context}\n\nQuestion: {payload.question}"}],
        }],
        "generationConfig": {"temperature": 0.4, "maxOutputTokens": 300},
    }
    url = (
        "https://generativelanguage.googleapis.com/v1beta/models/"
        f"{settings.GEMINI_MODEL}:generateContent"
    )

    try:
        async with httpx.AsyncClient(timeout=30) as client:
            response = await client.post(url, params={"key": settings.GEMINI_API_KEY}, json=request_body)
    except httpx.HTTPError:
        raise HTTPException(status_code=502, detail="Gemini service unavailable")

    if not response.is_success:
        raise HTTPException(status_code=502, detail="Gemini request failed")

    data = response.json()
    candidates = data.get("candidates", [])
    parts = candidates[0].get("content", {}).get("parts", []) if candidates else []
    text = "".join(part.get("text", "") for part in parts).strip()
    if not text:
        raise HTTPException(status_code=502, detail="Gemini returned an empty response")
    return {"reply": text}