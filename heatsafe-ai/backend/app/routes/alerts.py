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
    "Green": "Mausam abhi normal range mein hai, koi khaas savdhani ki zarurat nahi.",
    "Yellow": "Halki garmi ka asar ho sakta hai, paani peete rahein aur dhoop kam lein.",
    "Orange": "Dopahar 12 PM se 4 PM ke beech thermal stress zyada rehne ki sambhavna hai.",
    "Red": "Extreme thermal stress conditions expect ki ja rahi hain - outdoor kaam avoid karein.",
}


@router.get("/current")
async def current_alert(
    lat: float = Query(default=None),
    lon: float = Query(default=None),
    label: str = Query(default=None),
):
    """Live weather + ML model ke basis par ek ready-to-show alert banata hai."""
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
