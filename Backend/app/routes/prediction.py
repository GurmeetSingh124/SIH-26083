from fastapi import APIRouter
from pydantic import BaseModel
from app.services.risk_engine import calculate_heat_index
from app.services.prediction_service import predict_risk

router = APIRouter(prefix="/prediction", tags=["Prediction"])

class PredictionRequest(BaseModel):
    temperature: float
    humidity: float
    wind_speed: float = 0
    solar_radiation: float = 0

@router.post("/heatwave")
def heatwave_prediction(data: PredictionRequest):
    heat_index = calculate_heat_index(data.temperature, data.humidity)
    probability, risk, risk_score, model_status = predict_risk(
        data.temperature, data.humidity, data.wind_speed, data.solar_radiation
    )
    return {
        "temperature": data.temperature,
        "humidity": data.humidity,
        "wind_speed": data.wind_speed,
        "solar_radiation": data.solar_radiation,
        "heat_index": heat_index,
        "heatwave_probability": probability / 100,
        "predicted_risk": risk,
        "risk_score": risk_score,
        "model_status": model_status,
    }
