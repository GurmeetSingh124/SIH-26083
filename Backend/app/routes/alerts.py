from fastapi import APIRouter
from app.services.risk_engine import calculate_risk

router = APIRouter(prefix="/alerts", tags=["Alerts"])

@router.get("")
def alerts(city: str = "Meerut"):
    weather = {
        "temperature": 42.0,
        "humidity": 65.0,
        "uv_index": 9.0,
    }
    hi, score, level = calculate_risk(**weather)

    alert = score >= 75
    message = (
        "Extreme heat conditions detected. Stay hydrated and avoid prolonged outdoor exposure."
        if alert else
        "No high-level heat alert at this time."
    )

    return {
        "city": city,
        "alert": alert,
        "risk_level": level,
        "risk_score": score,
        "heat_index": hi,
        "message": message,
    }
