from motor.motor_asyncio import AsyncIOMotorClient
from app.core.config import settings

client = None
db = None

def get_database():
    return db

async def connect_to_mongo():
    global client, db
    print("Connecting to MongoDB...")
    client = AsyncIOMotorClient(settings.MONGO_URI)
    db = client["smart_scheduler"]
    print("Connected to MongoDB!")

async def close_mongo_connection():
    global client
    if client:
        client.close()
        print("MongoDB connection closed.")
