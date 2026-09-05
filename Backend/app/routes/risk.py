from fastapi import APIRouter
from pydantic import BaseModel
import json
from urllib.parse import urlencode
from urllib.request import Request, urlopen
from dotenv import load_dotenv
from app.services.prediction_service import predict_risk
from app.services.risk_engine import calculate_heat_index, calculate_risk

router = APIRouter(prefix="/risk", tags=["Risk Engine"])
load_dotenv()

class RiskRequest(BaseModel):
    temperature: float
    humidity: float
    uv_index: float = 0


LOCATION_WEATHER = {
    "Nabha": {"temperature": 43.5, "humidity": 68, "wind_speed": 7, "solar_radiation": 850, "dew_point": 32, "rainfall": 0},
    "Patiala": {"temperature": 42.1, "humidity": 61, "wind_speed": 9, "solar_radiation": 810, "dew_point": 30, "rainfall": 0},
    "Ludhiana": {"temperature": 40.8, "humidity": 55, "wind_speed": 11, "solar_radiation": 780, "dew_point": 27, "rainfall": 0},
    "Amritsar": {"temperature": 38.6, "humidity": 47, "wind_speed": 13, "solar_radiation": 720, "dew_point": 22, "rainfall": 0},
    "Chandigarh": {"temperature": 36.9, "humidity": 42, "wind_speed": 15, "solar_radiation": 690, "dew_point": 19, "rainfall": 2},
    "Delhi": {"temperature": 41.4, "humidity": 50, "wind_speed": 8, "solar_radiation": 800, "dew_point": 25, "rainfall": 0},
}


def fetch_live_weather(latitude: float, longitude: float):
    query = urlencode({
        "latitude": latitude,
        "longitude": longitude,
        "current": "temperature_2m,relative_humidity_2m,apparent_temperature,dew_point_2m,wind_speed_10m,shortwave_radiation,precipitation",
        "timezone": "auto",
    })
    with urlopen(f"https://api.open-meteo.com/v1/forecast?{query}", timeout=8) as response:
        payload = json.load(response)
    current = payload["current"]
    return {
        "temperature": current["temperature_2m"],
        "humidity": current["relative_humidity_2m"],
        "wind_speed": current["wind_speed_10m"],
        "solar_radiation": current.get("shortwave_radiation", 0),
        "dew_point": current["dew_point_2m"],
        "rainfall": current.get("precipitation", 0),
        "feels_like": current["apparent_temperature"],
    }


def reverse_geocode(latitude: float, longitude: float):
    query = urlencode({
        "lat": latitude,
        "lon": longitude,
        "format": "jsonv2",
        "zoom": 18,
    })
    request = Request(
        f"https://nominatim.openstreetmap.org/reverse?{query}",
        headers={"User-Agent": "HeatSafeAI/1.0"},
    )
    with urlopen(request, timeout=8) as response:
        address = json.load(response).get("address", {})
    return (
        address.get("neighbourhood")
        or address.get("suburb")
        or address.get("village")
        or address.get("town")
        or address.get("city")
        or address.get("municipality")
        or address.get("county")
        or "Your location"
    )


@router.get("")
def location_risk(location: str = "Nabha", lat: float | None = None, lon: float | None = None):
    coordinates = {"lat": lat, "lon": lon} if lat is not None and lon is not None else {}
    try:
        weather = fetch_live_weather(lat, lon) if coordinates else LOCATION_WEATHER.get(location, LOCATION_WEATHER["Nabha"])
        if coordinates:
            try:
                location = reverse_geocode(lat, lon)
            except Exception:
                location = "Your location"
        live = bool(coordinates)
    except Exception:
        weather = LOCATION_WEATHER.get(location, LOCATION_WEATHER["Nabha"])
        live = False

    heat_index = calculate_heat_index(weather["temperature"], weather["humidity"])
    heatwave_probability, thermal_risk, risk_score, model_status = predict_risk(
        weather["temperature"], weather["humidity"], weather["wind_speed"], weather["solar_radiation"]
    )
    return {
        "location": location,
        **coordinates,
        **weather,
        "feels_like": weather.get("feels_like", heat_index),
        "heat_index": heat_index,
        "thermal_risk": thermal_risk,
        "risk_score": risk_score,
        "heatwave_probability": heatwave_probability / 100,
        "model_status": model_status,
        "weather_status": "live" if live else "fallback",
    }

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
