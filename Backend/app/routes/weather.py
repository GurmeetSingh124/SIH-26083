from fastapi import APIRouter
from app.schemas.weather import WeatherInput
from app.services.risk_engine import calculate_risk

router = APIRouter(prefix="/weather", tags=["Weather"])

@router.get("/current")
def current_weather(city: str = "Meerut"):
    # Dummy data for development. Replace with a real weather provider in production.
    data = {
        "city": city,
        "temperature": 42.0,
        "humidity": 65.0,
        "wind_speed": 12.0,
        "uv_index": 9.0,
    }
    hi, score, level = calculate_risk(data["temperature"], data["humidity"], data["uv_index"])
    return {**data, "heat_index": hi, "risk_score": score, "risk_level": level}

@router.post("/calculate")
def calculate_weather_risk(data: WeatherInput):
    hi, score, level = calculate_risk(data.temperature, data.humidity, data.uv_index)
    return {
        **data.model_dump(),
        "heat_index": hi,
        "risk_score": score,
        "risk_level": level,
    }
