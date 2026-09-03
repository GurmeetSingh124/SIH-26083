from fastapi import APIRouter
from pydantic import BaseModel
from app.services.risk_engine import calculate_heat_index
from app.services.prediction_service import predict_heatwave

router = APIRouter(prefix="/prediction", tags=["Prediction"])

class PredictionRequest(BaseModel):
    temperature: float
    humidity: float

@router.post("/heatwave")
def heatwave_prediction(data: PredictionRequest):
    heat_index = calculate_heat_index(data.temperature, data.humidity)
    probability, risk = predict_heatwave(data.temperature, data.humidity, heat_index)
    return {
        "temperature": data.temperature,
        "humidity": data.humidity,
        "heat_index": heat_index,
        "heatwave_probability": probability,
        "predicted_risk": risk,
        "model_status": "baseline-demo",
    }
