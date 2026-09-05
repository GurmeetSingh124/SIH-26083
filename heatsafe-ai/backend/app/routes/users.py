from bson import ObjectId
from fastapi import APIRouter, HTTPException, Depends, status

from app.database.mongo import get_users_collection
from app.auth.security import hash_password, verify_password, create_access_token
from app.auth.dependencies import get_current_user
from app.ml import model as ml_model
from app.services import weather_service
from app.models.schemas import (
    UserRegisterIn, UserLoginIn, UserOut, TokenOut, UpdateLocationIn,
)

router = APIRouter(prefix="/users", tags=["Users"])


def _user_to_out(user: dict) -> UserOut:
    return UserOut(
        id=str(user["_id"]),
        name=user["name"],
        email=user["email"],
        location=user.get("location"),
        profile_type=user.get("profile_type", "general"),
    )


@router.post("/register", response_model=TokenOut, status_code=status.HTTP_201_CREATED)
async def register(payload: UserRegisterIn):
    users = get_users_collection()

    existing = await users.find_one({"email": payload.email})
    if existing:
        raise HTTPException(status_code=400, detail="Is email se account pehle se bana hua hai")

    user_doc = {
        "name": payload.name,
        "email": payload.email,
        "hashed_password": hash_password(payload.password),
        "location": payload.location.model_dump() if payload.location else None,
        "profile_type": payload.profile_type,
    }
    res = await users.insert_one(user_doc)
    user_doc["_id"] = res.inserted_id

    token = create_access_token({"user_id": str(res.inserted_id)})
    return TokenOut(access_token=token, user=_user_to_out(user_doc))


@router.post("/login", response_model=TokenOut)
async def login(payload: UserLoginIn):
    users = get_users_collection()
    user = await users.find_one({"email": payload.email})
    if not user or not verify_password(payload.password, user["hashed_password"]):
        raise HTTPException(status_code=401, detail="Email ya password galat hai")

    token = create_access_token({"user_id": str(user["_id"])})
    return TokenOut(access_token=token, user=_user_to_out(user))


@router.get("/me", response_model=UserOut)
async def get_me(current_user: dict = Depends(get_current_user)):
    return _user_to_out(current_user)


@router.put("/me/location", response_model=UserOut)
async def update_my_location(payload: UpdateLocationIn, current_user: dict = Depends(get_current_user)):
    users = get_users_collection()
    await users.update_one(
        {"_id": ObjectId(current_user["id"])},
        {"$set": {"location": payload.model_dump()}},
    )
    updated = await users.find_one({"_id": ObjectId(current_user["id"])})
    return _user_to_out(updated)


@router.get("/me/heat-risk")
async def my_area_heat_risk(current_user: dict = Depends(get_current_user)):
    """
    Logged-in user ki saved location (MongoDB) ke hisaab se
    unke area ka live heat-stress risk batata hai.
    """
    location = current_user.get("location")
    if not location:
        raise HTTPException(
            status_code=400,
            detail="Pehle apni location save karein (PUT /api/users/me/location)",
        )

    weather = await weather_service.get_current_weather(location["lat"], location["lon"])
    result = ml_model.predict_risk(
        temperature_c=weather["temperature_c"],
        humidity_pct=weather["humidity_pct"],
        wind_speed_kmh=weather["wind_speed_kmh"],
        solar_radiation_w_m2=weather["solar_radiation_w_m2"],
    )
    return {
        "location": location,
        "weather": weather,
        "risk": result,
    }
