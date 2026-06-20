from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes.api import router as api_router
from app.database import connect_to_mongo, close_mongo_connection

app = FastAPI(title="CityTrail API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # For development, allow all origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup_event():
    await connect_to_mongo()

@app.on_event("shutdown")
async def shutdown_event():
    await close_mongo_connection()

app.include_router(api_router, prefix="/api")

@app.get("/")
def read_root():
    return {"message": "CityTrail API is running."}
