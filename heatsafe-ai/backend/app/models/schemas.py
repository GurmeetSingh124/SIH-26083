from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List


# ---------------- Users / Auth ----------------

class LocationIn(BaseModel):
    label: str = Field(..., examples=["Nabha, Punjab"])
    lat: float
    lon: float


class UserRegisterIn(BaseModel):
    name: str
    email: EmailStr
    password: str = Field(..., min_length=6)
    location: Optional[LocationIn] = None
    profile_type: str = Field(default="general", examples=["student", "farmer", "worker", "elderly", "athlete", "general"])


class UserLoginIn(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    id: str
    name: str
    email: EmailStr
    location: Optional[LocationIn] = None
    profile_type: str = "general"


class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


class UpdateLocationIn(BaseModel):
    label: str
    lat: float
    lon: float


# ---------------- Weather ----------------

class WeatherOut(BaseModel):
    location_label: str
    lat: float
    lon: float
    temperature_c: float
    humidity_pct: float
    wind_speed_kmh: float
    solar_radiation_w_m2: float
    pressure_hpa: Optional[float] = None
    rainfall_mm: Optional[float] = None
    dew_point_c: Optional[float] = None
    observed_at: str
    source: str = "open-meteo"


class GeocodeResult(BaseModel):
    label: str
    lat: float
    lon: float
    country: Optional[str] = None
    admin1: Optional[str] = None


# ---------------- Risk ----------------

class RiskManualIn(BaseModel):
    temperature_c: float
    humidity_pct: float
    wind_speed_kmh: float
    solar_radiation_w_m2: float


class RiskOut(BaseModel):
    risk_level: str          # Green / Yellow / Orange / Red
    risk_status: str         # Low / Moderate / High / Extreme
    risk_score: float        # 0-100
    heat_index_c: float
    heatwave_probability: float
    model_confidence: float
    top_reasons: List[str]
    recommended_action: str
    inputs: RiskManualIn


class HeatZonePoint(BaseModel):
    lat: float
    lon: float
    risk_level: str
    risk_score: float
    temperature_c: float


class HeatZoneOut(BaseModel):
    center_lat: float
    center_lon: float
    points: List[HeatZonePoint]


class ForecastPoint(BaseModel):
    hour_offset: int
    timestamp: str
    temperature_c: float
    humidity_pct: float
    risk_level: str
    risk_score: float
    heatwave_probability: float


class ForecastOut(BaseModel):
    location_label: str
    points: List[ForecastPoint]
