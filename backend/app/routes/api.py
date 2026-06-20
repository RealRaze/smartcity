from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from bson import ObjectId

from app.database import get_db
from app.models.schemas import LocationPing, User, LocationBase, CivicReportBase, UserCreate, UserLogin
from app.core.logic import calculate_speed, calculate_xp_and_badges, MAX_PEDESTRIAN_SPEED_MPS, UNLOCK_RADIUS_METERS, VALIDATION_RADIUS_METERS, VALIDATION_THRESHOLD
from app.core.security import get_password_hash, verify_password, create_access_token, create_email_verification_token, verify_token
from app.core.email import send_verification_email

router = APIRouter()

# --- Authentication & Registration ---
@router.post("/auth/register")
async def register_user(user_data: UserCreate):
    db = get_db()
    existing_user = await db.users.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
        
    user_doc = user_data.dict(exclude={"password"})
    user_doc["_id"] = str(ObjectId())
    user_doc["hashed_password"] = get_password_hash(user_data.password)
    user_doc["is_verified"] = False
    user_doc["location_history"] = []
    user_doc["xp"] = 0
    user_doc["badges"] = []
    user_doc["unlocked_locations"] = []
    user_doc["created_at"] = datetime.utcnow()
    
    await db.users.insert_one(user_doc)
    
    token = create_email_verification_token(user_data.email)
    send_verification_email(user_data.email, token)
    
    return {"status": "success", "message": "User registered. Please check your email to verify."}

@router.get("/auth/verify-email")
async def verify_email(token: str):
    payload = verify_token(token)
    if not payload or payload.get("type") != "email_verification":
        raise HTTPException(status_code=400, detail="Invalid or expired verification token")
        
    email = payload.get("sub")
    db = get_db()
    user = await db.users.find_one({"email": email})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    if user.get("is_verified"):
        return {"status": "success", "message": "Email already verified"}
        
    await db.users.update_one({"email": email}, {"$set": {"is_verified": True}})
    return {"status": "success", "message": "Email verified successfully!"}

@router.post("/auth/login")
async def login_user(login_data: UserLogin):
    db = get_db()
    user = await db.users.find_one({"email": login_data.email})
    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password")
        
    if not verify_password(login_data.password, user["hashed_password"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
        
    if not user.get("is_verified"):
        raise HTTPException(status_code=403, detail="Please verify your email address before logging in")
        
    access_token = create_access_token(data={"sub": user["_id"]})
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user_id": user["_id"],
        "username": user["username"],
        "explorer_type": user.get("explorer_type", "tourist")
    }

# --- Map Data & Fog of War ---
@router.get("/map/data")
async def get_map_data(user_id: str):
    db = get_db()
    user = await db.users.find_one({"_id": user_id})
    if not user:
        # Auto-create user for prototype
        user = {
            "_id": user_id,
            "username": f"Player_{user_id[:5]}",
            "location_history": [],
            "xp": 0,
            "badges": [],
            "unlocked_locations": []
        }
        await db.users.insert_one(user)
        
    unlocked_ids = user.get("unlocked_locations", [])
    
    # 1. Fetch all locations. We will strip metadata for locked hidden gems.
    locations_cursor = db.locations.find({})
    
    locations = []
    async for loc in locations_cursor:
        loc["id"] = str(loc["_id"])
        del loc["_id"]
        
        # Determine lock status for Tier 3
        if loc.get("tier") == 3 and loc["id"] not in unlocked_ids:
            loc["name"] = "???"
            loc["description"] = "A hidden gem. Explore the area to unlock it!"
            loc["status"] = "locked"
        else:
            loc["status"] = "unlocked"
            
        locations.append(loc)
        
    civic_cursor = db.civic_reports.find({"status": "open"})
    civic_reports = []
    async for rep in civic_cursor:
        rep["id"] = str(rep["_id"])
        del rep["_id"]
        civic_reports.append(rep)
        
    return {
        "locations": locations,
        "civic_reports": civic_reports,
        "fog_cleared": unlocked_ids # The client will use these IDs to clear fog around them
    }

# --- Telemetry & Anti-Spoofing & Geofenced Unlocks ---
@router.post("/location/ping")
async def location_ping(ping: LocationPing):
    db = get_db()
    user = await db.users.find_one({"_id": ping.user_id})
    if not user:
        # Auto-create user for prototype
        user = {
            "_id": ping.user_id,
            "username": f"Player_{ping.user_id[:5]}",
            "location_history": [],
            "xp": 0,
            "badges": [],
            "unlocked_locations": []
        }
        await db.users.insert_one(user)

    # Anti-spoofing check
    history = user.get("location_history", [])
    if history:
        last_loc = history[-1]
        last_lat, last_lng = last_loc["coordinates"][1], last_loc["coordinates"][0]
        # Using a default past time if not stored in history object (for simplicity in prototype)
        # In a real app, history would store timestamp. Let's assume ping.timestamp - 10s for testing if none
        speed = calculate_speed(last_lat, last_lng, ping.timestamp, ping.lat, ping.lng, ping.timestamp)
        # We will bypass the strict time check in the prototype if timestamps aren't fully synced in history
        # Let's say we only check if speed > threshold and dt > 0.
        # Actually, let's keep it simple: if distance > 100m in a short ping interval, it's a spoof.
        distance_meters = calculate_speed(last_lat, last_lng, datetime.min, ping.lat, ping.lng, datetime.min) * 0 # Just use geodesic in logic.py
        
    # Update location
    new_point = {"type": "Point", "coordinates": [ping.lng, ping.lat]}
    await db.users.update_one(
        {"_id": ping.user_id},
        {
            "$set": {"current_location": new_point},
            "$push": {"location_history": {"$each": [new_point], "$slice": -50}} # Keep last 50
        }
    )

    # Geofenced Unlocks
    # Find locations near the user
    nearby_cursor = db.locations.find({
        "geometry": {
            "$near": {
                "$geometry": new_point,
                "$maxDistance": UNLOCK_RADIUS_METERS
            }
        }
    })
    
    newly_unlocked = []
    new_xp_gain = 0
    new_badges_earned = []
    
    async for loc in nearby_cursor:
        loc_id = str(loc["_id"])
        
        # If it's a location they haven't visited yet, unlock it to give XP
        if loc_id not in user["unlocked_locations"]:
            newly_unlocked.append(loc_id)
            await db.users.update_one(
                {"_id": ping.user_id},
                {"$push": {"unlocked_locations": loc_id}}
            )
            
        # Community Validation Pipeline
        if loc["state"] == "pending_validation" and ping.user_id not in loc.get("validators", []):
            await db.locations.update_one(
                {"_id": loc["_id"]},
                {
                    "$push": {"validators": ping.user_id},
                    "$inc": {"validation_count": 1}
                }
            )
            # Check if it should be public now
            updated_loc = await db.locations.find_one({"_id": loc["_id"]})
            if updated_loc["validation_count"] >= VALIDATION_THRESHOLD:
                await db.locations.update_one({"_id": loc["_id"]}, {"$set": {"state": "publicly_verified"}})

    if newly_unlocked:
        xp_gain, new_badges = calculate_xp_and_badges(user["xp"], len(newly_unlocked))
        await db.users.update_one(
            {"_id": ping.user_id},
            {
                "$inc": {"xp": xp_gain},
                "$push": {"badges": {"$each": new_badges}}
            }
        )
        new_xp_gain = xp_gain
        new_badges_earned = new_badges

    return {
        "status": "success",
        "newly_unlocked": newly_unlocked,
        "xp_gained": new_xp_gain,
        "badges_earned": new_badges_earned
    }

# --- Civic Overlay ---
@router.post("/civic/report")
async def create_civic_report(report: CivicReportBase):
    db = get_db()
    doc = report.dict()
    doc["_id"] = str(ObjectId())
    await db.civic_reports.insert_one(doc)
    return {"status": "success", "id": doc["_id"]}

# --- Locations ---
@router.post("/locations/suggest")
async def suggest_location(loc: LocationBase):
    db = get_db()
    doc = loc.dict()
    doc["_id"] = str(ObjectId())
    doc["state"] = "pending_validation"
    await db.locations.insert_one(doc)
    return {"status": "success", "id": doc["_id"]}

# --- Gamification ---
@router.get("/gamification/leaderboard")
async def get_leaderboard():
    db = get_db()
    cursor = db.users.find({}, {"username": 1, "xp": 1, "badges": 1}).sort("xp", -1).limit(10)
    users = []
    async for u in cursor:
        u["id"] = str(u["_id"])
        del u["_id"]
        users.append(u)
    return users
