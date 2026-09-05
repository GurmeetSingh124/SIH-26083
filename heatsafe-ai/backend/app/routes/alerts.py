from fastapi import APIRouter, Query
from app.ml import model as ml_model
from app.services import weather_service
from app.config import settings

router = APIRouter(prefix="/alerts", tags=["Alerts"])

ALERT_TITLES = {
    "Green": "Normal conditions",
    "Yellow": "Heat advisory",
    "Orange": "High heat warning",
    "Red": "Extreme heat alert",
}

ALERT_TEXTS = {
    "Green": "Weather is currently within the normal range; no special precautions are needed.",
    "Yellow": "Mild heat effects are possible. Keep drinking water and limit sun exposure.",
    "Orange": "Higher thermal stress is likely between 12 PM and 4 PM.",
    "Red": "Extreme thermal stress conditions are expected. Avoid outdoor work.",
}


@router.get("/current")
async def current_alert(
    lat: float = Query(default=None),
    lon: float = Query(default=None),
    label: str = Query(default=None),
):
    """Build a ready-to-display alert from live weather and the ML model."""
    lat = lat if lat is not None else settings.DEFAULT_LAT
    lon = lon if lon is not None else settings.DEFAULT_LON

    weather = await weather_service.get_current_weather(lat, lon)
    result = ml_model.predict_risk(
        temperature_c=weather["temperature_c"],
        humidity_pct=weather["humidity_pct"],
        wind_speed_kmh=weather["wind_speed_kmh"],
        solar_radiation_w_m2=weather["solar_radiation_w_m2"],
    )

    level = result["risk_level"]
    return {
        "location_label": label or settings.DEFAULT_LOCATION_LABEL,
        "active": level in ("Orange", "Red"),
        "level": level,
        "title": ALERT_TITLES[level],
        "message": ALERT_TEXTS[level],
        "heatwave_probability": result["heatwave_probability"],
        "risk_score": result["risk_score"],
        "peak_window": "12 PM - 4 PM",
    }
