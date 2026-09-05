"""
Yaha tumhara heat_risk_model.pkl load hota hai aur asli prediction isi file se hoti hai.

Model details (mlModel.ipynb se confirm kiya gaya):
  - Type: RandomForestClassifier (scikit-learn 1.7.2, n_estimators=150, max_depth=8)
  - Input features (isi order me): temperature_c, humidity_pct, wind_speed_kmh, solar_radiation_w_m2
  - Output classes (LabelEncoder alphabetical order): 0=Green, 1=Orange, 2=Red, 3=Yellow
  - Training label khud heat_index se derive hui thi (get_risk_level function)

Isliye hum ML model ki prediction + heat-index formula dono ko combine karke
final accurate result dete hain (jaisa notebook ke predict_heat_risk() me tha).
"""
import os
import numpy as np
import pandas as pd
import joblib

MODEL_PATH = os.path.join(os.path.dirname(__file__), "heat_risk_model.pkl")

FEATURE_ORDER = ["temperature_c", "humidity_pct", "wind_speed_kmh", "solar_radiation_w_m2"]

# LabelEncoder alphabetical order encode karta hai: Green, Orange, Red, Yellow
CLASS_INDEX_TO_LEVEL = {0: "Green", 1: "Orange", 2: "Red", 3: "Yellow"}

# Severity ke hisaab se sahi order (dashboard/UI ke liye)
RISK_ORDER = ["Green", "Yellow", "Orange", "Red"]

LEVEL_TO_STATUS = {
    "Green": "Low",
    "Yellow": "Moderate",
    "Orange": "High",
    "Red": "Extreme",
}

ACTION_MAP = {
    "Green": "Normal precautions lein - paani peete rahein.",
    "Yellow": "Paani piyein aur direct dhoop se bachein.",
    "Orange": "Dopahar 12 PM se 4 PM tak outdoor kaam kam karein.",
    "Red": "Turant alert bhejein, ORS/paani point arrange karein, health centre ready rakhein aur outdoor kaam avoid karein.",
}

_model = None


def get_model():
    """Model ko sirf ek baar load karta hai (lazy singleton)."""
    global _model
    if _model is None:
        _model = joblib.load(MODEL_PATH)
    return _model


def calculate_heat_index(temp_c: float, humidity_pct: float) -> float:
    """Rothfusz regression - notebook wala hi exact formula."""
    T = temp_c * 9 / 5 + 32
    R = humidity_pct
    HI = (
        -42.379 + 2.04901523 * T + 10.14333127 * R - 0.22475541 * T * R
        - 0.00683783 * T * T - 0.05481717 * R * R + 0.00122874 * T * T * R
        + 0.00085282 * T * R * R - 0.00000199 * T * T * R * R
    )
    return (HI - 32) * 5 / 9


def calculate_risk_score(heat_index_c: float) -> float:
    score = (heat_index_c - 20) / (55 - 20) * 100
    return round(float(np.clip(score, 0, 100)), 1)


def build_reasons(temperature_c, humidity_pct, wind_speed_kmh, solar_radiation_w_m2):
    reasons = []
    if temperature_c >= 40:
        reasons.append("Temperature bahut zyada hai")
    elif temperature_c >= 35:
        reasons.append("Temperature high hai")

    if humidity_pct >= 60:
        reasons.append("Humidity zyada hai, isse garmi aur khatarnak feel hoti hai")

    if wind_speed_kmh < 5:
        reasons.append("Wind speed kam hai, isliye garmi zyada feel hogi")

    if solar_radiation_w_m2 >= 700:
        reasons.append("Solar radiation bahut zyada hai, direct dhoop mein risk badh jaata hai")

    if not reasons:
        reasons.append("Weather conditions abhi normal range mein hain")

    return reasons


def predict_risk(temperature_c: float, humidity_pct: float, wind_speed_kmh: float, solar_radiation_w_m2: float) -> dict:
    """
    Real ML model (RandomForest) se prediction + heat-index-based score,
    dono ko combine karke ek accurate, explainable result deta hai.
    """
    model = get_model()

    # DataFrame use karte hain (raw numpy array nahi) taaki sklearn warning na aaye -
    # model training ke waqt named columns ke saath fit hua tha.
    X = pd.DataFrame(
        [[temperature_c, humidity_pct, wind_speed_kmh, solar_radiation_w_m2]],
        columns=FEATURE_ORDER,
    )
    pred_class = int(model.predict(X)[0])
    proba = model.predict_proba(X)[0]
    confidence = float(np.max(proba))

    ml_risk_level = CLASS_INDEX_TO_LEVEL[pred_class]

    # Heat-index se bhi cross-check (jaisa training data banaya gaya tha)
    heat_index_c = calculate_heat_index(temperature_c, humidity_pct)
    risk_score = calculate_risk_score(heat_index_c)

    # Final risk level = ML model ka output (yehi tumhara trained model hai)
    risk_level = ml_risk_level
    risk_status = LEVEL_TO_STATUS[risk_level]

    # Heatwave probability = Orange+Red classes ki combined probability
    orange_idx = [k for k, v in CLASS_INDEX_TO_LEVEL.items() if v == "Orange"][0]
    red_idx = [k for k, v in CLASS_INDEX_TO_LEVEL.items() if v == "Red"][0]
    heatwave_probability = round(float(proba[orange_idx] + proba[red_idx]) * 100, 1)

    return {
        "risk_level": risk_level,
        "risk_status": risk_status,
        "risk_score": risk_score,
        "heat_index_c": round(heat_index_c, 1),
        "heatwave_probability": heatwave_probability,
        "model_confidence": round(confidence * 100, 1),
        "top_reasons": build_reasons(temperature_c, humidity_pct, wind_speed_kmh, solar_radiation_w_m2),
        "recommended_action": ACTION_MAP[risk_level],
    }
