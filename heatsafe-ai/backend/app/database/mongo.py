"""
MongoDB connection (Motor async driver).
Users collection isi database me rehta hai: name, email, hashed_password, location.
"""
from motor.motor_asyncio import AsyncIOMotorClient
from app.config import settings

client: AsyncIOMotorClient | None = None
db = None


def connect_to_mongo():
    global client, db
    client = AsyncIOMotorClient(settings.MONGODB_URL)
    db = client[settings.MONGODB_DB_NAME]
    return db


def close_mongo_connection():
    global client
    if client:
        client.close()


def get_db():
    global db
    if db is None:
        connect_to_mongo()
    return db


def get_users_collection():
    return get_db()["users"]
