from app.services.risk_engine import calculate_risk

def test_risk_output():
    heat_index, score, level = calculate_risk(42, 65, 9)
    assert heat_index > 42
    assert 0 <= score <= 100
    assert level in {"Low", "Moderate", "High", "Very High", "Extreme"}
