# SIH26083 Heatwave & Thermal Stress Prediction — Backend

FastAPI backend starter for the SIH26083 project.

## Features
- FastAPI server + Swagger docs
- Weather demo/current API
- Heat Index calculation
- Heat-risk scoring: Low, Moderate, High, Very High, Extreme
- Heatwave prediction baseline
- Alert API
- User register/login demo endpoints
- SQLite + SQLAlchemy foundation
- CORS enabled for frontend integration

## Run on Windows

```powershell
python -m venv venv
venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn main:app --reload
```

Open:
- http://127.0.0.1:8000
- http://127.0.0.1:8000/docs

## Important
The weather endpoint currently uses dummy data, and prediction is a baseline demo. For the hackathon final build, connect a real weather API, persist records in the database, add JWT authentication, and train/serve the ML model.
