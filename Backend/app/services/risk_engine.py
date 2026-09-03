def calculate_heat_index(temperature_c: float, humidity: float) -> float:
    # Practical approximation for demo/API use.
    # Converts C to F, applies Rothfusz heat-index equation when applicable.
    t = temperature_c * 9 / 5 + 32
    rh = humidity

    if t < 80:
        return round(temperature_c, 1)

    hi = (-42.379 + 2.04901523*t + 10.14333127*rh
          - 0.22475541*t*rh - 0.00683783*t*t
          - 0.05481717*rh*rh + 0.00122874*t*t*rh
          + 0.00085282*t*rh*rh - 0.00000199*t*t*rh*rh)
    return round((hi - 32) * 5 / 9, 1)

def calculate_risk(temperature_c: float, humidity: float, uv_index: float = 0):
    heat_index = calculate_heat_index(temperature_c, humidity)

    score = 0
    score += min(max((temperature_c - 30) * 4, 0), 45)
    score += min(max((humidity - 40) * 0.7, 0), 25)
    score += min(max((heat_index - 35) * 2.0, 0), 20)
    score += min(max(uv_index * 1.2, 0), 10)
    score = round(min(score, 100), 1)

    if score < 25:
        level = "Low"
    elif score < 50:
        level = "Moderate"
    elif score < 75:
        level = "High"
    elif score < 90:
        level = "Very High"
    else:
        level = "Extreme"

    return heat_index, score, level
