from sqlalchemy import Column, Integer, Float, String, DateTime
from datetime import datetime
from app.database.db import Base

class WeatherRecord(Base):
    __tablename__ = "weather_records"

    id = Column(Integer, primary_key=True, index=True)
    city = Column(String, index=True)
    temperature = Column(Float)
    humidity = Column(Float)
    wind_speed = Column(Float)
    uv_index = Column(Float)
    heat_index = Column(Float)
    risk_score = Column(Float)
    risk_level = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
