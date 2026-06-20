import React, { useState, useEffect, useCallback } from 'react';
import MapComponent from './components/MapComponent';
import HUDComponent from './components/HUDComponent';
import CivicReportingModal from './components/CivicReportingModal';
import { locationService } from './services/api';
import './index.css';

// Mock user ID for prototype
const USER_ID = "user123";

function App() {
  const [currentLocation, setCurrentLocation] = useState({ lat: 18.5050, lng: 73.8150 }); // Default to Kothrud
  const [isManualMode, setIsManualMode] = useState(true); // Default to true so real GPS doesn't teleport them to America!
  const [theme, setTheme] = useState('light');
  const [mapData, setMapData] = useState({ locations: [], civic_reports: [], fog_cleared: [] });
  const [userState, setUserState] = useState({
    username: "CityExplorer99",
    xp: 0,
    unlocked_locations: [],
    badges: []
  });
  
  const [isReportingModalOpen, setIsReportingModalOpen] = useState(false);
  const [alerts, setAlerts] = useState([]);

  // Fetch initial map data
  const fetchMapData = useCallback(async () => {
    try {
      const data = await locationService.getMapData(USER_ID);
      setMapData(data);
    } catch (err) {
      console.error("Failed to fetch map data", err);
    }
  }, []);

  useEffect(() => {
    fetchMapData();
  }, [fetchMapData]);

  // Keyboard controls for testing
  useEffect(() => {
    const handleKeyDown = (e) => {
      const step = 0.0001; // ~10 meters to avoid anti-spoofing rejection
      
      if (['w', 'a', 's', 'd'].includes(e.key.toLowerCase())) {
        setIsManualMode(true);
        setCurrentLocation(prev => {
          let newLat = prev.lat;
          let newLng = prev.lng;
          
          if (e.key.toLowerCase() === 'w') newLat += step;
          if (e.key.toLowerCase() === 's') newLat -= step;
          if (e.key.toLowerCase() === 'a') newLng -= step;
          if (e.key.toLowerCase() === 'd') newLng += step;
          
          return { lat: newLat, lng: newLng };
        });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Handle Location Pings (Debounced for WASD)
  useEffect(() => {
    if (!currentLocation) return;

    const pingTimer = setTimeout(async () => {
      try {
        const result = await locationService.pingLocation(USER_ID, currentLocation.lat, currentLocation.lng);
        
        // Update user state if new things were unlocked
        if (result.newly_unlocked?.length > 0) {
          setUserState(prev => ({
            ...prev,
            xp: prev.xp + result.xp_gained,
            unlocked_locations: [...prev.unlocked_locations, ...result.newly_unlocked],
            badges: [...prev.badges, ...(result.badges_earned || [])]
          }));
          
          // Show alert
          const newAlerts = result.newly_unlocked.map((id, index) => ({
            id: Date.now() + index,
            message: `New Location Discovered! +${result.xp_gained} XP`
          }));
          
          setAlerts(prev => [...prev, ...newAlerts]);
          setTimeout(() => {
            setAlerts(prev => prev.filter(a => !newAlerts.find(na => na.id === a.id)));
          }, 4000);
          
          // Refresh map data to clear fog
          fetchMapData();
        }
      } catch (err) {
        console.error("Ping failed (possibly anti-spoofing rejection):", err);
      }
    }, 1500); // 1.5s debounce to allow "walking" with WASD before pinging

    return () => clearTimeout(pingTimer);
  }, [currentLocation, fetchMapData]);

  // Real GPS tracking
  useEffect(() => {
    let watchId;
    
    if ("geolocation" in navigator && !isManualMode) {
      watchId = navigator.geolocation.watchPosition(
        (position) => {
          if (!isManualMode) {
            setCurrentLocation({
              lat: position.coords.latitude,
              lng: position.coords.longitude
            });
          }
        },
        (err) => console.error(err),
        { enableHighAccuracy: true, maximumAge: 0 }
      );
    }
    
    return () => {
      if (watchId) navigator.geolocation.clearWatch(watchId);
    };
  }, [isManualMode]);

  return (
    <div className="retro-frame">
      <div className={`app-container theme-${theme}`}>
        <MapComponent 
          currentLocation={currentLocation} 
          mapData={mapData} 
          theme={theme}
        />
        
        <HUDComponent 
          user={userState} 
          onReportClick={() => setIsReportingModalOpen(true)} 
          theme={theme}
          toggleTheme={() => setTheme(prev => prev === 'light' ? 'dark' : 'light')}
        />
        
        <CivicReportingModal 
          isOpen={isReportingModalOpen}
          onClose={() => setIsReportingModalOpen(false)}
          currentLocation={currentLocation}
          userId={USER_ID}
          onSuccess={fetchMapData}
        />

        {/* Alerts */}
        {alerts.map(alert => (
          <div key={alert.id} className="unlocked-alert">
            <span style={{ fontSize: '24px' }}>🏆</span>
            <span>{alert.message}</span>
          </div>
        ))}
        
        {/* Dev Mode Indicator */}
        {isManualMode && (
          <div className="pixel-panel" style={{
            position: 'absolute', bottom: 16, right: 16, zIndex: 1000, 
            padding: '8px', color: 'var(--text-yellow)'
          }}>
            WASD DEV MODE
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
