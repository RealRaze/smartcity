from pydantic import BaseModel, Field
from typing import List, Optional, Literal
from datetime import datetime

class Point(BaseModel):
    type: str = "Point"
    coordinates: List[float] # [longitude, latitude]

class LocationPing(BaseModel):
    user_id: str
    lat: float
    lng: float
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class UserBase(BaseModel):
    username: str
    email: str
    explorer_type: Literal["tourist", "new_resident", "local"] = "tourist"

class UserCreate(UserBase):
    password: str

class UserLogin(BaseModel):
    email: str
    password: str

class UserInDB(UserBase):
    id: str = Field(alias="_id")
    hashed_password: str
    is_verified: bool = False
    current_location: Optional[Point] = None
    location_history: List[Point] = []
    xp: int = 0
    badges: List[str] = []
    unlocked_locations: List[str] = []
    created_at: datetime = Field(default_factory=datetime.utcnow)

# We still need the User response schema (without hashed_password)
class User(UserBase):
    id: str = Field(alias="_id")
    is_verified: bool
    current_location: Optional[Point] = None
    location_history: List[Point] = []
    xp: int = 0
    badges: List[str] = []
    unlocked_locations: List[str] = []

class LocationBase(BaseModel):
    name: str
    description: str
    geometry: Point
    type: Literal["landmark", "hidden_gem"]
    state: Literal["pending_validation", "publicly_verified"] = "pending_validation"
    validation_count: int = 0
    validators: List[str] = []

class LocationInDB(LocationBase):
    id: str = Field(alias="_id")

class CivicReportBase(BaseModel):
    description: str
    geometry: Point
    image_payload: Optional[str] = None # Base64 for prototype
    reporter_id: str
    status: Literal["open", "in_progress", "resolved"] = "open"

class CivicReportInDB(CivicReportBase):
    id: str = Field(alias="_id")
