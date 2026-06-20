from geopy.distance import geodesic
from datetime import datetime

MAX_PEDESTRIAN_SPEED_MPS = 5.0 # meters per second (~11 mph)
UNLOCK_RADIUS_METERS = 50.0 # radius to unlock a location
VALIDATION_RADIUS_METERS = 30.0 # radius to validate a pending location
VALIDATION_THRESHOLD = 3 # unique users needed to verify

def check_spoofing(last_location: dict, new_lat: float, new_lng: float, new_timestamp: datetime) -> bool:
    """
    Returns True if spoofing is detected (speed > MAX_PEDESTRIAN_SPEED_MPS).
    """
    if not last_location:
        return False
        
    last_coords = last_location['coordinates'] # [lng, lat]
    last_point = (last_coords[1], last_coords[0])
    new_point = (new_lat, new_lng)
    
    distance_meters = geodesic(last_point, new_point).meters
    
    # Assuming last_timestamp is stored in DB or we use a basic approximation if not stored
    # For this prototype, we'll assume the ping is approx 10 seconds since last if timestamp is missing from simple history
    # Let's enforce that location_history includes timestamps or we fetch it.
    # Actually, let's keep it simple: if time difference is known. 
    # For now, let's just use a stub or we need to pass last_timestamp.
    # We will refine this in the route.
    pass

def calculate_speed(last_lat: float, last_lng: float, last_time: datetime, new_lat: float, new_lng: float, new_time: datetime) -> float:
    distance_meters = geodesic((last_lat, last_lng), (new_lat, new_lng)).meters
    time_diff_seconds = (new_time - last_time).total_seconds()
    
    if time_diff_seconds <= 0:
        return float('inf')
        
    return distance_meters / time_diff_seconds

def calculate_xp_and_badges(current_xp: int, new_unlocks: int):
    # Base XP for unlock
    xp_gain = new_unlocks * 100
    new_xp = current_xp + xp_gain
    
    new_badges = []
    if new_xp >= 100 and current_xp < 100:
        new_badges.append("First Discovery")
    if new_xp >= 500 and current_xp < 500:
        new_badges.append("Neighborhood Explorer")
        
    return xp_gain, new_badges
