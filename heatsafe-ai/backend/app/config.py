"""
Saari environment settings yaha se load hoti hain (.env file se).
Kahi bhi hardcoded secret/key nahi honi chahiye - sab yaha se aayega.
"""
import os
from dotenv import load_dotenv

load_dotenv()


class Settings:
    # ---- MongoDB (user accounts + saved locations) ----
    MONGODB_URL: str = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
    MONGODB_DB_NAME: str = os.getenv("MONGODB_DB_NAME", "heatsafe_ai")

    # ---- JWT auth ----
    JWT_SECRET_KEY: str = os.getenv("JWT_SECRET_KEY", "change-this-secret-in-.env")
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRE_MINUTES: int = int(os.getenv("JWT_EXPIRE_MINUTES", "10080"))  # 7 din

    # ---- Weather ----
    # Open-Meteo ekdum FREE hai aur isme API key ki zarurat NAHI padti
    # (live temperature, humidity, wind, solar radiation, forecast - sab free).
    OPEN_METEO_BASE_URL: str = "https://api.open-meteo.com/v1/forecast"
    OPEN_METEO_GEOCODE_URL: str = "https://geocoding-api.open-meteo.com/v1/search"

    # OpenWeatherMap API key. Key hone par current weather aur forecast isi provider se aayenge.
    WEATHER_API_KEY: str = os.getenv("WEATHER_API_KEY", "")
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    GEMINI_MODEL: str = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")
    OPENWEATHER_BASE_URL: str = "https://api.openweathermap.org/data/2.5"
    VISUAL_CROSSING_API_KEY: str = os.getenv("VISUAL_CROSSING_API_KEY", "")
    VISUAL_CROSSING_BASE_URL: str = "https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline"

    # ---- Default location (Nabha, Punjab) agar user location na de ----
    DEFAULT_LAT: float = float(os.getenv("DEFAULT_LAT", "30.3745"))
    DEFAULT_LON: float = float(os.getenv("DEFAULT_LON", "76.1516"))
    DEFAULT_LOCATION_LABEL: str = os.getenv("DEFAULT_LOCATION_LABEL", "Nabha, Punjab")

    # ---- CORS ----
    FRONTEND_ORIGINS: list = os.getenv(
        "FRONTEND_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173"
    ).split(",")


settings = Settings()
