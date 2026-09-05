from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database.mongo import connect_to_mongo, close_mongo_connection
from app.ml.model import get_model
from app.routes.weather import router as weather_router
from app.routes.assistant import router as assistant_router
from app.routes.risk import router as risk_router
from app.routes.alerts import router as alerts_router
from app.routes.users import router as users_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: MongoDB connect + ML model preload (taaki pehli request slow na ho)
    connect_to_mongo()
    get_model()
    yield
    # Shutdown
    close_mongo_connection()


app = FastAPI(
    title="HeatSafe AI Backend",
    description="FastAPI backend - live weather, ML-based heat risk prediction, heat-zone map data, MongoDB user auth.",
    version="2.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.FRONTEND_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(weather_router, prefix="/api")
app.include_router(assistant_router, prefix="/api")
app.include_router(risk_router, prefix="/api")
app.include_router(alerts_router, prefix="/api")
app.include_router(users_router, prefix="/api")


@app.get("/")
def root():
    return {"project": "HeatSafe AI", "message": "Backend running", "docs": "/docs"}


@app.get("/health")
def health():
    return {"status": "OK"}
