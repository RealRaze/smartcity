import os
from motor.motor_asyncio import AsyncIOMotorClient

MONGODB_URL = os.environ.get("MONGODB_URL", "mongodb://localhost:27017")
DB_NAME = os.environ.get("DB_NAME", "citytrail")

class Database:
    client: AsyncIOMotorClient = None

db = Database()

async def connect_to_mongo():
    db.client = AsyncIOMotorClient(MONGODB_URL)
    database = db.client[DB_NAME]
    
    # Create 2dsphere indexes
    await database.users.create_index([("current_location", "2dsphere")])
    await database.locations.create_index([("geometry", "2dsphere")])
    await database.civic_reports.create_index([("geometry", "2dsphere")])
    print("Connected to MongoDB and created 2dsphere indexes")

async def close_mongo_connection():
    db.client.close()
    print("Closed MongoDB connection")

def get_db():
    return db.client[DB_NAME]
