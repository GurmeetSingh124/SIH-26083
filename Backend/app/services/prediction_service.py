from pathlib import Path

import joblib
import pandas as pd


MODEL_PATH = Path(__file__).resolve().parents[3] / "Model Train" / "heat_risk_model.pkl"
MODEL = joblib.load(MODEL_PATH) if MODEL_PATH.exists() else None
RISK_LABELS = {0: "Low", 1: "High", 2: "Extreme", 3: "Moderate"}
RISK_SCORES = {0: 20, 1: 70, 2: 90, 3: 45}


def predict_risk(
    temperature: float,
    humidity: float,
    wind_speed: float,
    solar_radiation: float,
):
    features = pd.DataFrame([{
        "temperature_c": temperature,
        "humidity_pct": humidity,
        "wind_speed_kmh": wind_speed,
        "solar_radiation_w_m2": solar_radiation,
    }])

    if MODEL is None:
        probability = min(max(temperature * 1.25 + humidity * 0.2, 0), 99)
        label = "Red" if probability >= 80 else "Orange" if probability >= 60 else "Yellow" if probability >= 40 else "Green"
        return round(probability, 1), RISK_LABELS[label], float(probability), "baseline"

    predicted_label = int(MODEL.predict(features)[0])
    probabilities = dict(zip(MODEL.classes_, MODEL.predict_proba(features)[0]))
    heatwave_probability = round((probabilities.get(2, 0) + probabilities.get(1, 0)) * 100, 1)
    risk_score = round(RISK_SCORES.get(predicted_label, 45) + probabilities.get(predicted_label, 0) * 10, 1)
    return heatwave_probability, RISK_LABELS.get(predicted_label, "Moderate"), min(risk_score, 100), "trained"


def predict_heatwave(temperature: float, humidity: float, heat_index: float):
    probability, risk, _, _ = predict_risk(temperature, humidity, 0, 0)
    return probability, risk
