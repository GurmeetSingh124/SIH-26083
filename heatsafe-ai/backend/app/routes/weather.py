from fastapi import APIRouter, Query, HTTPException, Response
import httpx
import time
from collections import OrderedDict
from app.services import weather_service
from app.config import settings
from app.models.schemas import WeatherOut, GeocodeResult

router = APIRouter(prefix="/weather", tags=["Weather"])

OPENWEATHER_TILE_LAYERS = {"temp_new", "clouds_new", "precipitation_new", "wind_new"}
TILE_CACHE_TTL_SECONDS = 300
TILE_CACHE_MAX_ITEMS = 256
tile_cache = OrderedDict()


@router.get("/tiles/{layer}/{z}/{x}/{y}.png", response_class=Response)
async def openweather_tile(layer: str, z: int, x: int, y: int):
    """Proxy OpenWeather map tiles without exposing the API key to the browser."""
    if layer not in OPENWEATHER_TILE_LAYERS:
        raise HTTPException(status_code=404, detail="Unsupported weather map layer")
    if not settings.WEATHER_API_KEY:
        raise HTTPException(status_code=503, detail="OpenWeather API key is not configured")

    cache_key = (layer, z, x, y)
    cached = tile_cache.get(cache_key)
    if cached and time.monotonic() - cached[0] < TILE_CACHE_TTL_SECONDS:
        tile_cache.move_to_end(cache_key)
        return Response(
            content=cached[1],
            media_type="image/png",
            headers={"Cache-Control": "public, max-age=300", "X-Tile-Cache": "HIT"},
        )

    tile_url = f"https://tile.openweathermap.org/map/{layer}/{z}/{x}/{y}.png"
    try:
        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.get(tile_url, params={"appid": settings.WEATHER_API_KEY})
    except httpx.HTTPError:
        raise HTTPException(status_code=502, detail="Weather map tile fetch failed")

    if not resp.is_success:
        raise HTTPException(status_code=resp.status_code, detail="Weather map tile unavailable")

    tile_cache[cache_key] = (time.monotonic(), resp.content)
    tile_cache.move_to_end(cache_key)
    while len(tile_cache) > TILE_CACHE_MAX_ITEMS:
        tile_cache.popitem(last=False)
    return Response(
        content=resp.content,
        media_type="image/png",
        headers={"Cache-Control": "public, max-age=300", "X-Tile-Cache": "MISS"},
    )


@router.get("/current", response_model=WeatherOut)
async def current_weather(
    lat: float = Query(default=None, description="Latitude"),
    lon: float = Query(default=None, description="Longitude"),
    label: str = Query(default=None, description="Location ka naam, display ke liye"),
):
    """Kisi bhi lat/lon ke liye live weather (Open-Meteo se, koi API key nahi chahiye)."""
    lat = lat if lat is not None else settings.DEFAULT_LAT
    lon = lon if lon is not None else settings.DEFAULT_LON
    try:
        data = await weather_service.get_current_weather(lat, lon)
    except Exception:
        raise HTTPException(status_code=502, detail="Live weather data abhi fetch nahi ho paaya, dobara try karein")

    return WeatherOut(
        location_label=label or settings.DEFAULT_LOCATION_LABEL,
        lat=lat,
        lon=lon,
        temperature_c=data["temperature_c"],
        humidity_pct=data["humidity_pct"],
        wind_speed_kmh=data["wind_speed_kmh"],
        solar_radiation_w_m2=data["solar_radiation_w_m2"],
        pressure_hpa=data.get("pressure_hpa"),
        rainfall_mm=data.get("rainfall_mm"),
        dew_point_c=data.get("dew_point_c"),
        observed_at=data["observed_at"],
    )


@router.get("/geocode", response_model=list[GeocodeResult])
async def search_location(q: str = Query(..., min_length=2)):
    """Location naam type karke uska lat/lon dhoondhna (search box ke liye)."""
    results = await weather_service.geocode_location(q)
    return results
