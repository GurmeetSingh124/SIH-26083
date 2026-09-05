from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes.weather import router as weather_router
from app.routes.risk import router as risk_router
from app.routes.prediction import router as prediction_router
from app.routes.alerts import router as alerts_router
from app.routes.users import router as users_router

app = FastAPI(
    title="SIH26083 Heatwave & Thermal Stress Backend",
    description="FastAPI backend for weather monitoring, heat risk, prediction and alerts.",
    version="1.0.0",
    docs_url=None,
    redoc_url=None,
    openapi_url=None,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(weather_router, prefix="/api")
app.include_router(risk_router, prefix="/api")
app.include_router(prediction_router, prefix="/api")
app.include_router(alerts_router, prefix="/api")
app.include_router(users_router, prefix="/api")

@app.get("/")
def root():
    return {"project": "SIH26083", "message": "Heatwave backend is running"}

@app.get("/health")
def health():
    return {"status": "OK", "message": "Backend is running"}
