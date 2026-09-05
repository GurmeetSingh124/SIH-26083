import asyncio
from fastapi import APIRouter, Query, HTTPException
from app.ml import model as ml_model
from app.services import weather_service
from app.config import settings
from app.models.schemas import RiskOut, RiskManualIn, HeatZoneOut, HeatZonePoint, ForecastOut, ForecastPoint

router = APIRouter(prefix="/risk", tags=["Risk"])


@router.get("/predict", response_model=RiskOut)
async def predict_from_location(
    lat: float = Query(default=None),
    lon: float = Query(default=None),
):
    """
    Live weather (lat/lon) uthata hai aur seedha tumhare heat_risk_model.pkl
    se accurate prediction deta hai. Ye hi wo endpoint hai jo dashboard use karega.
    """
    lat = lat if lat is not None else settings.DEFAULT_LAT
    lon = lon if lon is not None else settings.DEFAULT_LON

    try:
        weather = await weather_service.get_current_weather(lat, lon)
    except Exception:
        raise HTTPException(status_code=502, detail="Live weather fetch fail hui")

    result = ml_model.predict_risk(
        temperature_c=weather["temperature_c"],
        humidity_pct=weather["humidity_pct"],
        wind_speed_kmh=weather["wind_speed_kmh"],
        solar_radiation_w_m2=weather["solar_radiation_w_m2"],
    )
    result["inputs"] = RiskManualIn(
        temperature_c=weather["temperature_c"],
        humidity_pct=weather["humidity_pct"],
        wind_speed_kmh=weather["wind_speed_kmh"],
        solar_radiation_w_m2=weather["solar_radiation_w_m2"],
    )
    return RiskOut(**result)


@router.post("/predict-manual", response_model=RiskOut)
async def predict_manual(payload: RiskManualIn):
    """Manually values daal kar model test karne ke liye (Swagger /docs me try karo)."""
    result = ml_model.predict_risk(
        temperature_c=payload.temperature_c,
        humidity_pct=payload.humidity_pct,
        wind_speed_kmh=payload.wind_speed_kmh,
        solar_radiation_w_m2=payload.solar_radiation_w_m2,
    )
    result["inputs"] = payload
    return RiskOut(**result)


@router.get("/heatzones", response_model=HeatZoneOut)
async def heat_zone_grid(
    lat: float = Query(default=None),
    lon: float = Query(default=None),
    radius_km: float = Query(default=25, ge=5, le=100),
    grid_size: int = Query(default=5, ge=3, le=9, description="grid_size x grid_size points banega"),
):
    """
    Map par heat-zones dikhane ke liye: center location ke around ek grid banata hai,
    har grid-point ke liye live weather + ML prediction karta hai.
    """
    lat = lat if lat is not None else settings.DEFAULT_LAT
    lon = lon if lon is not None else settings.DEFAULT_LON

    # ~1 degree latitude = 111 km
    step_deg = (radius_km / 111.0) * 2 / max(grid_size - 1, 1)
    half = (grid_size - 1) / 2

    grid_coords = [
        (lat + (i - half) * step_deg, lon + (j - half) * step_deg)
        for i in range(grid_size)
        for j in range(grid_size)
    ]

    try:
        weather_points = await weather_service.get_current_weather_batch(grid_coords)
    except Exception:
        weather_points = []

    points = []
    for weather in weather_points:
        result = ml_model.predict_risk(
            temperature_c=weather["temperature_c"],
            humidity_pct=weather["humidity_pct"],
            wind_speed_kmh=weather["wind_speed_kmh"],
            solar_radiation_w_m2=weather["solar_radiation_w_m2"],
        )
        points.append(HeatZonePoint(
            lat=weather["lat"],
            lon=weather["lon"],
            risk_level=result["risk_level"],
            risk_score=result["risk_score"],
            temperature_c=weather["temperature_c"],
        ))

    return HeatZoneOut(center_lat=lat, center_lon=lon, points=points)


@router.get("/forecast", response_model=ForecastOut)
async def forecast(
    lat: float = Query(default=None),
    lon: float = Query(default=None),
    hours: int = Query(default=24, ge=6, le=72),
    label: str = Query(default=None),
):
    """24 / 48 / 72 ghanton ka heatwave prediction chart ke liye."""
    lat = lat if lat is not None else settings.DEFAULT_LAT
    lon = lon if lon is not None else settings.DEFAULT_LON

    try:
        hourly = await weather_service.get_hourly_forecast(lat, lon, hours=hours)
    except Exception:
        raise HTTPException(status_code=502, detail="Forecast fetch fail hua")

    points = []
    for idx, h in enumerate(hourly):
        if h["temperature_c"] is None:
            continue
        result = ml_model.predict_risk(
            temperature_c=h["temperature_c"],
            humidity_pct=h["humidity_pct"] or 0.0,
            wind_speed_kmh=h["wind_speed_kmh"] or 0.0,
            solar_radiation_w_m2=h["solar_radiation_w_m2"] or 0.0,
        )
        points.append(ForecastPoint(
            hour_offset=idx,
            timestamp=h["timestamp"],
            temperature_c=h["temperature_c"],
            humidity_pct=h["humidity_pct"] or 0.0,
            risk_level=result["risk_level"],
            risk_score=result["risk_score"],
            heatwave_probability=result["heatwave_probability"],
        ))

    return ForecastOut(location_label=label or settings.DEFAULT_LOCATION_LABEL, points=points)
