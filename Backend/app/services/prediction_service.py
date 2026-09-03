def predict_heatwave(temperature: float, humidity: float, heat_index: float):
    # Baseline demo predictor. Replace with trained ML model in Phase 3.
    probability = (
        temperature * 1.25 +
        humidity * 0.20 +
        max(heat_index - 35, 0) * 2.0
    )
    probability = round(min(max(probability, 0), 99), 1)

    if probability >= 80:
        risk = "Extreme"
    elif probability >= 60:
        risk = "High"
    elif probability >= 40:
        risk = "Moderate"
    else:
        risk = "Low"

    return probability, risk
