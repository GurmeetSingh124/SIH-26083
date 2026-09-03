from pydantic import BaseModel

class WeatherInput(BaseModel):
    city: str
    temperature: float
    humidity: float
    wind_speed: float = 0
    uv_index: float = 0
