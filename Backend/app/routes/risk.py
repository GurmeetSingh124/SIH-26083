from fastapi import APIRouter
from pydantic import BaseModel
from app.services.risk_engine import calculate_risk

router = APIRouter(prefix="/risk", tags=["Risk Engine"])

class RiskRequest(BaseModel):
    temperature: float
    humidity: float
    uv_index: float = 0

@router.post("/calculate")
def risk_calculation(data: RiskRequest):
    heat_index, score, level = calculate_risk(
        data.temperature, data.humidity, data.uv_index
    )
    return {
        "heat_index": heat_index,
        "risk_score": score,
        "risk_level": level,
    }
