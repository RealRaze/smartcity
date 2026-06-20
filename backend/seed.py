import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

import certifi

load_dotenv()

MONGODB_URL = os.getenv("MONGODB_URL", "mongodb://db:27017")
client = AsyncIOMotorClient(MONGODB_URL, tlsCAFile=certifi.where())
db = client.citytrail

async def seed():
    print(f"Connecting to MongoDB at {MONGODB_URL}...")
    
    # Drop existing data
    print("Dropping existing collections...")
    await db.users.drop()
    await db.locations.drop()
    await db.civic_reports.drop()

    print("Inserting users...")
    user_id = "mock_user_123"
    await db.users.insert_one({
        "user_id": user_id,
        "xp": 0,
        "level": 1,
        "badges": [],
        "unlocked_locations": []
    })

    print("Inserting 15 Kothrud locations...")
    locations = [
        # --- Tier 1 (Must-Visit) ---
        {
            "id": "dashabhuja_ganpati", "name": "Dashabhuja Ganpati Mandir", "type": "landmark",
            "description": "Historic and highly revered temple in Kothrud.", "geometry": {"type": "Point", "coordinates": [73.8211, 18.5036]},
            "xp_reward": 50, "tier": 1, "status": "unlocked", "rating": 4.8, "review_snippet": "Peaceful atmosphere and beautiful architecture. A must visit."
        },
        {
            "id": "durga_cafe", "name": "Durga Cafe", "type": "landmark",
            "description": "Famous for its cold coffee and college crowd.", "geometry": {"type": "Point", "coordinates": [73.8164, 18.5034]},
            "xp_reward": 50, "tier": 1, "status": "unlocked", "rating": 4.5, "review_snippet": "Best thick cold coffee in Pune! Always crowded but worth it."
        },
        {
            "id": "maratha_samrat", "name": "Maratha Samrat", "type": "landmark",
            "description": "Iconic restaurant for authentic Maharashtrian non-veg thalis.", "geometry": {"type": "Point", "coordinates": [73.8155, 18.5005]},
            "xp_reward": 50, "tier": 1, "status": "unlocked", "rating": 4.6, "review_snippet": "The mutton thali here is absolutely legendary. Authentic taste."
        },
        {
            "id": "yashwantrao_chavan", "name": "Yashwantrao Chavan Natyagruha", "type": "landmark",
            "description": "Famous theatre hosting classic Marathi plays and events.", "geometry": {"type": "Point", "coordinates": [73.8143, 18.5036]},
            "xp_reward": 50, "tier": 1, "status": "unlocked", "rating": 4.3, "review_snippet": "Great seating and acoustics for cultural performances."
        },
        {
            "id": "joshis_museum", "name": "Joshi's Museum of Miniature Railways", "type": "landmark",
            "description": "Unique museum featuring a detailed miniature city and railway layout.", "geometry": {"type": "Point", "coordinates": [73.8197, 18.4965]},
            "xp_reward": 50, "tier": 1, "status": "unlocked", "rating": 4.7, "review_snippet": "A delightful experience for both kids and adults!"
        },

        # --- Tier 2 (Everyday) ---
        {
            "id": "kothrud_depot", "name": "Kothrud PMPML Bus Depot", "type": "landmark",
            "description": "Major transit hub for the area.", "geometry": {"type": "Point", "coordinates": [73.8055, 18.5075]},
            "xp_reward": 30, "tier": 2, "status": "unlocked", "rating": 3.8, "review_snippet": "Busy depot, well connected to all parts of the city."
        },
        {
            "id": "arai_base", "name": "ARAI Hills Base", "type": "landmark",
            "description": "Starting point for the Vetal Hill trek.", "geometry": {"type": "Point", "coordinates": [73.8160, 18.5170]},
            "xp_reward": 30, "tier": 2, "status": "unlocked", "rating": 4.8, "review_snippet": "Perfect for morning walks. Lots of peacocks and fresh air."
        },
        {
            "id": "tatya_tope_udyan", "name": "Tatya Tope Udyan", "type": "landmark",
            "description": "Local park for evening walks.", "geometry": {"type": "Point", "coordinates": [73.8105, 18.5050]},
            "xp_reward": 30, "tier": 2, "status": "unlocked", "rating": 4.1, "review_snippet": "Nice community park with a jogging track and kids area."
        },
        {
            "id": "mit_khau_galli", "name": "MIT Khau Galli", "type": "landmark",
            "description": "Bustling food street next to MIT college.", "geometry": {"type": "Point", "coordinates": [73.8185, 18.5200]},
            "xp_reward": 30, "tier": 2, "status": "unlocked", "rating": 4.6, "review_snippet": "Amazing street food variety! Momos and dosas are fantastic."
        },
        {
            "id": "mrutyunjayeshwar", "name": "Mrutyunjayeshwar Temple", "type": "landmark",
            "description": "Ancient Shiva temple with a peaceful courtyard.", "geometry": {"type": "Point", "coordinates": [73.8180, 18.5015]},
            "xp_reward": 30, "tier": 2, "status": "unlocked", "rating": 4.9, "review_snippet": "Very serene and historically significant temple. So calming."
        },

        # --- Tier 3 (Hidden Gems) ---
        {
            "id": "vikram_pendse_museum", "name": "Vikram Pendse's Cycle Museum", "type": "hidden_gem",
            "description": "Private collection of vintage bicycles and artifacts.", "geometry": {"type": "Point", "coordinates": [73.8235, 18.4960]},
            "xp_reward": 200, "tier": 3, "status": "locked", "rating": 4.9, "review_snippet": "An absolute hidden gem! The collection of bicycles is mind-blowing."
        },
        {
            "id": "waari_book_cafe", "name": "Waari Book Cafe", "type": "hidden_gem",
            "description": "A cozy, quiet haven for readers and coffee lovers.", "geometry": {"type": "Point", "coordinates": [73.8165, 18.5090]},
            "xp_reward": 200, "tier": 3, "status": "locked", "rating": 4.8, "review_snippet": "Best place to read a book in peace while sipping hot chocolate."
        },
        {
            "id": "leafy_trails", "name": "Leafy Trails Café", "type": "hidden_gem",
            "description": "Hidden cafe surrounded by lush greenery.", "geometry": {"type": "Point", "coordinates": [73.8110, 18.5130]},
            "xp_reward": 200, "tier": 3, "status": "locked", "rating": 4.5, "review_snippet": "A beautiful secret cafe tucked away in the trees. Great aesthetic."
        },
        {
            "id": "bacharika", "name": "Bacharika", "type": "hidden_gem",
            "description": "Secret rooftop lounge with a great view and vibe.", "geometry": {"type": "Point", "coordinates": [73.8145, 18.5055]},
            "xp_reward": 200, "tier": 3, "status": "locked", "rating": 4.4, "review_snippet": "Awesome rooftop views of Kothrud and a very relaxed vibe."
        },
        {
            "id": "abandoned_quarry", "name": "The Abandoned Quarry Viewpoint", "type": "hidden_gem",
            "description": "An off-trail spot offering dramatic views of an old stone quarry.", "geometry": {"type": "Point", "coordinates": [73.8050, 18.5150]},
            "xp_reward": 300, "tier": 3, "status": "locked", "rating": 4.7, "review_snippet": "A little hard to find, but the sunset view over the quarry is incredible."
        }
    ]
    
    for loc in locations:
        if "state" not in loc:
            loc["state"] = "publicly_verified" # Keep this old field for backwards compatibility with the ping API logic

    await db.locations.insert_many(locations)

    print("Inserting mock civic reports...")
    reports = [
        {
            "id": "report_1",
            "user_id": "other_user",
            "type": "pothole",
            "description": "Deep pothole on the road towards VIT upper gate.",
            "geometry": {"type": "Point", "coordinates": [73.8680, 18.4630]},
            "status": "open",
            "validations": 2
        },
        {
            "id": "report_2",
            "user_id": "other_user_2",
            "type": "streetlight",
            "description": "Streetlight broken on the path up to Taljai Hills.",
            "geometry": {"type": "Point", "coordinates": [73.8490, 18.4720]},
            "status": "open",
            "validations": 5
        }
    ]
    await db.civic_reports.insert_many(reports)

    print("Creating geospatial indexes...")
    await db.locations.create_index([("geometry", "2dsphere")])
    await db.civic_reports.create_index([("geometry", "2dsphere")])

    print("Seeding complete!")

if __name__ == "__main__":
    asyncio.run(seed())
