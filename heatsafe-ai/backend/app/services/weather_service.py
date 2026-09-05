"""
Live weather data - Open-Meteo API se aata hai.

IMPORTANT: Open-Meteo bilkul FREE hai aur ismein koi API key ki zarurat NAHI hai
(non-commercial use ke liye). Isliye project turant live data ke saath chal
sakta hai bina kisi key ke.

Agar future me tum OpenWeatherMap ya kisi paid provider ka istemal karna
chahte ho (jyada accurate hyperlocal data / push alerts ke liye), to us
provider ki API key `.env` file me `WEATHER_API_KEY` variable me daal dena -
uske baad is file me sirf ek naya function jodna hoga.
"""
import httpx
from datetime import datetime, timezone
from app.config import settings


def _visual_crossing_current(data: dict, lat: float, lon: float) -> dict:
    current = data.get("currentConditions", {})
    return {
        "lat": lat,
        "lon": lon,
        "temperature_c": current.get("temp", 0.0),
        "humidity_pct": current.get("humidity", 0.0),
        "wind_speed_kmh": current.get("windspeed", 0.0),
        "solar_radiation_w_m2": current.get("solarradiation") or 0.0,
        "pressure_hpa": current.get("pressure"),
        "rainfall_mm": current.get("precip", 0.0),
        "dew_point_c": current.get("dew"),
        "observed_at": current.get("datetime") or datetime.now(timezone.utc).isoformat(),
    }


def _openweather_current(data: dict, lat: float, lon: float) -> dict:
    current = data.get("main", {})
    wind = data.get("wind", {})
    rain = data.get("rain", {})
    return {
        "lat": lat,
        "lon": lon,
        "temperature_c": current.get("temp", 0.0),
        "humidity_pct": current.get("humidity", 0.0),
        "wind_speed_kmh": (wind.get("speed") or 0.0) * 3.6,
        "solar_radiation_w_m2": 0.0,
        "pressure_hpa": current.get("pressure"),
        "rainfall_mm": rain.get("1h", rain.get("3h", 0.0)),
        "dew_point_c": None,
        "observed_at": datetime.fromtimestamp(data.get("dt", 0), timezone.utc).isoformat(),
    }


async def get_current_weather(lat: float, lon: float) -> dict:
    """OpenWeatherMap weather when configured, with existing providers as fallback."""
    if settings.WEATHER_API_KEY:
        params = {
            "lat": lat,
            "lon": lon,
            "appid": settings.WEATHER_API_KEY,
            "units": "metric",
        }
        async with httpx.AsyncClient(timeout=20) as client:
            resp = await client.get(f"{settings.OPENWEATHER_BASE_URL}/weather", params=params)
            if resp.is_success:
                return _openweather_current(resp.json(), lat, lon)

    if settings.VISUAL_CROSSING_API_KEY:
        url = f"{settings.VISUAL_CROSSING_BASE_URL}/{lat},{lon}"
        params = {
            "unitGroup": "metric",
            "include": "current",
            "key": settings.VISUAL_CROSSING_API_KEY,
            "contentType": "json",
        }
        async with httpx.AsyncClient(timeout=20) as client:
            resp = await client.get(url, params=params)
            resp.raise_for_status()
            return _visual_crossing_current(resp.json(), lat, lon)

    params = {
        "latitude": lat,
        "longitude": lon,
        "current": ",".join([
            "temperature_2m",
            "relative_humidity_2m",
            "wind_speed_10m",
            "surface_pressure",
            "shortwave_radiation",
            "precipitation",
            "dew_point_2m",
        ]),
        "timezone": "auto",
    }
    async with httpx.AsyncClient(timeout=10) as client:
        resp = await client.get(settings.OPEN_METEO_BASE_URL, params=params)
        resp.raise_for_status()
        data = resp.json()

    current = data.get("current", {})
    return {
        "lat": lat,
        "lon": lon,
        "temperature_c": current.get("temperature_2m", 0.0),
        "humidity_pct": current.get("relative_humidity_2m", 0.0),
        "wind_speed_kmh": current.get("wind_speed_10m", 0.0),
        # Open-Meteo "current" block me shortwave_radiation kabhi kabhi raat me 0/None hoti hai
        "solar_radiation_w_m2": current.get("shortwave_radiation") or 0.0,
        "pressure_hpa": current.get("surface_pressure"),
        "rainfall_mm": current.get("precipitation"),
        "dew_point_c": current.get("dew_point_2m"),
        "observed_at": current.get("time") or datetime.now(timezone.utc).isoformat(),
    }


async def get_current_weather_batch(coordinates: list[tuple[float, float]]) -> list[dict]:
    """Fetch current weather for several coordinates in one Open-Meteo request."""
    if not coordinates:
        return []

    params = {
        "latitude": ",".join(str(lat) for lat, _ in coordinates),
        "longitude": ",".join(str(lon) for _, lon in coordinates),
        "current": ",".join([
            "temperature_2m",
            "relative_humidity_2m",
            "wind_speed_10m",
            "surface_pressure",
            "shortwave_radiation",
            "precipitation",
            "dew_point_2m",
        ]),
        "timezone": "auto",
    }
    last_error = None
    for _ in range(3):
        try:
            async with httpx.AsyncClient(timeout=30) as client:
                resp = await client.get(settings.OPEN_METEO_BASE_URL, params=params)
                resp.raise_for_status()
                data = resp.json()
            break
        except Exception as exc:
            last_error = exc
    else:
        raise last_error

    locations = data if isinstance(data, list) else [data]
    results = []
    for (lat, lon), location in zip(coordinates, locations):
        current = location.get("current", {})
        results.append({
            "lat": lat,
            "lon": lon,
            "temperature_c": current.get("temperature_2m", 0.0),
            "humidity_pct": current.get("relative_humidity_2m", 0.0),
            "wind_speed_kmh": current.get("wind_speed_10m", 0.0),
            "solar_radiation_w_m2": current.get("shortwave_radiation") or 0.0,
            "pressure_hpa": current.get("surface_pressure"),
            "rainfall_mm": current.get("precipitation"),
            "dew_point_c": current.get("dew_point_2m"),
            "observed_at": current.get("time") or datetime.now(timezone.utc).isoformat(),
        })
    return results


async def get_hourly_forecast(lat: float, lon: float, hours: int = 72) -> list[dict]:
    """Agle N ghanton ka hourly forecast (temperature + humidity + wind + solar radiation)."""
    if settings.WEATHER_API_KEY:
        params = {
            "lat": lat,
            "lon": lon,
            "appid": settings.WEATHER_API_KEY,
            "units": "metric",
        }
        async with httpx.AsyncClient(timeout=20) as client:
            resp = await client.get(f"{settings.OPENWEATHER_BASE_URL}/forecast", params=params)
            if resp.is_success:
                data = resp.json()
            else:
                data = None

        if data:
            out = []
            for item in data.get("list", [])[: max(1, (hours + 2) // 3)]:
                main = item.get("main", {})
                wind = item.get("wind", {})
                rain = item.get("rain", {})
                out.append({
                    "timestamp": item.get("dt_txt") or datetime.fromtimestamp(item.get("dt", 0), timezone.utc).isoformat(),
                    "temperature_c": main.get("temp"),
                    "humidity_pct": main.get("humidity"),
                    "wind_speed_kmh": (wind.get("speed") or 0.0) * 3.6,
                    "solar_radiation_w_m2": 0.0,
                    "rainfall_mm": rain.get("3h", 0.0),
                })
            return out

    if settings.VISUAL_CROSSING_API_KEY:
        url = f"{settings.VISUAL_CROSSING_BASE_URL}/{lat},{lon}"
        params = {
            "unitGroup": "metric",
            "include": "hours",
            "forecastDays": "4",
            "key": settings.VISUAL_CROSSING_API_KEY,
            "contentType": "json",
        }
        async with httpx.AsyncClient(timeout=20) as client:
            resp = await client.get(url, params=params)
            resp.raise_for_status()
            data = resp.json()

        out = []
        for day in data.get("days", []):
            for hour in day.get("hours", []):
                if len(out) >= hours:
                    return out
                out.append({
                    "timestamp": f"{day.get('datetime')}T{hour.get('datetime')}",
                    "temperature_c": hour.get("temp"),
                    "humidity_pct": hour.get("humidity"),
                    "wind_speed_kmh": hour.get("windspeed"),
                    "solar_radiation_w_m2": hour.get("solarradiation") or 0.0,
                })
        return out

    params = {
        "latitude": lat,
        "longitude": lon,
        "hourly": ",".join([
            "temperature_2m",
            "relative_humidity_2m",
            "wind_speed_10m",
            "shortwave_radiation",
        ]),
        "forecast_days": 4,
        "timezone": "auto",
    }
    async with httpx.AsyncClient(timeout=10) as client:
        resp = await client.get(settings.OPEN_METEO_BASE_URL, params=params)
        resp.raise_for_status()
        data = resp.json()

    hourly = data.get("hourly", {})
    times = hourly.get("time", [])[:hours]
    temps = hourly.get("temperature_2m", [])
    hums = hourly.get("relative_humidity_2m", [])
    winds = hourly.get("wind_speed_10m", [])
    solars = hourly.get("shortwave_radiation", [])

    out = []
    for i, t in enumerate(times):
        out.append({
            "timestamp": t,
            "temperature_c": temps[i] if i < len(temps) else None,
            "humidity_pct": hums[i] if i < len(hums) else None,
            "wind_speed_kmh": winds[i] if i < len(winds) else None,
            "solar_radiation_w_m2": (solars[i] if i < len(solars) and solars[i] is not None else 0.0),
        })
    return out


async def geocode_location(query: str) -> list[dict]:
    """Location naam se lat/lon dhoondta hai (jaise 'Nabha' ya 'Ludhiana, Punjab')."""
    params = {"name": query, "count": 5, "language": "en", "format": "json"}
    async with httpx.AsyncClient(timeout=10) as client:
        resp = await client.get(settings.OPEN_METEO_GEOCODE_URL, params=params)
        resp.raise_for_status()
        data = resp.json()

    results = []
    for r in data.get("results", []):
        results.append({
            "label": f"{r.get('name')}, {r.get('admin1', '')}".strip(", "),
            "lat": r.get("latitude"),
            "lon": r.get("longitude"),
            "country": r.get("country"),
            "admin1": r.get("admin1"),
        })
    return results
