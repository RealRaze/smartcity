import React, { useState, useEffect, useCallback } from 'react';
import MapComponent from './components/MapComponent';
import HUDComponent from './components/HUDComponent';
import CivicReportingModal from './components/CivicReportingModal';
import SuggestPlaceModal from './components/SuggestPlaceModal';
import LoginScreen from './components/LoginScreen';
import VerifyEmail from './components/VerifyEmail';
import { locationService } from './services/api';
import './index.css';

function App() {
  const [currentLocation, setCurrentLocation] = useState({ lat: 18.5050, lng: 73.8150 }); // Default to Kothrud
  const [isManualMode, setIsManualMode] = useState(true); // Default to true so real GPS doesn't teleport them to America!
  const [theme, setTheme] = useState('light');
  const [mapData, setMapData] = useState({ locations: [], civic_reports: [], fog_cleared: [] });
  const [userState, setUserState] = useState({
    username: "",
    xp: 0,
    unlocked_locations: [],
    badges: []
  });
  
  // Auth state
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [explorerType, setExplorerType] = useState('tourist'); // 'tourist', 'new_resident', 'local'
  const [USER_ID, setUserId] = useState('');
  const [token, setToken] = useState('');
  
  const [isReportingModalOpen, setIsReportingModalOpen] = useState(false);
  const [isSuggestModalOpen, setIsSuggestModalOpen] = useState(false);
  const [alerts, setAlerts] = useState([]);
  const [activeLandmark, setActiveLandmark] = useState(null);
  const [flyingXp, setFlyingXp] = useState([]);
  const [isMoving, setIsMoving] = useState(false);
  const movementTimeoutRef = React.useRef(null);

  // Check for email verification route
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationToken, setVerificationToken] = useState(null);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tokenParam = urlParams.get('token');
    const pathname = window.location.pathname;

    if (pathname === '/verify' || tokenParam) {
      setIsVerifying(true);
      setVerificationToken(tokenParam);
    }
  }, []);

  // Fetch initial map data
  const fetchMapData = useCallback(async () => {
    if (!USER_ID || !token) return;
    try {
      const data = await locationService.getMapData(USER_ID, token);
      
      // Filter locations based on explorerType
      let allowedTiers = [1];
      if (explorerType === 'new_resident') allowedTiers = [1, 2];
      if (explorerType === 'local') allowedTiers = [1, 2, 3];

      const filteredLocations = data.locations.filter(loc => allowedTiers.includes(loc.tier));
      data.locations = filteredLocations;

      setMapData(data);
    } catch (err) {
      console.error("Failed to load map data:", err);
      if (err.response?.status === 401) {
        handleLogout();
      }
    }
  }, [USER_ID, token, explorerType]);

  useEffect(() => {
    fetchMapData();
  }, [fetchMapData]);

  // Keyboard controls for testing
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ignore keypresses if modals are open or user is typing in an input
      if (isReportingModalOpen || isSuggestModalOpen) return;
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return;
      
      const step = 0.0001; // ~10 meters to avoid anti-spoofing rejection
      
      if (['w', 'a', 's', 'd'].includes(e.key.toLowerCase())) {
        setIsManualMode(true);
        setIsMoving(true);
        
        if (movementTimeoutRef.current) clearTimeout(movementTimeoutRef.current);
        movementTimeoutRef.current = setTimeout(() => setIsMoving(false), 500);

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
  }, [isReportingModalOpen, isSuggestModalOpen]);

  // Handle Location Pings (Debounced for WASD)
  useEffect(() => {
    if (!currentLocation || !USER_ID || !token) return;

    const pingTimer = setTimeout(async () => {
      try {
        const result = await locationService.pingLocation(USER_ID, currentLocation.lat, currentLocation.lng, token);
        
        // Update user state if new things were unlocked
        if (result.newly_unlocked?.length > 0) {
          setUserState(prev => {
            const newUnlocked = [...prev.unlocked_locations, ...result.newly_unlocked];
            const newBadges = [...prev.badges, ...(result.badges_earned || [])];
            
            // Exploration Milestones
            const milestones = [
              { count: 5, name: "🌟 TRAILBLAZER (5 Places)" },
              { count: 10, name: "🗺️ URBAN EXPLORER (10 Places)" },
              { count: 15, name: "👑 CITY MASTER (15 Places)" }
            ];
            
            let milestoneAlerts = [];
            milestones.forEach(m => {
              if (prev.unlocked_locations.length < m.count && newUnlocked.length >= m.count) {
                newBadges.push({ name: m.name });
                milestoneAlerts.push({
                  id: Date.now() + Math.random(),
                  message: `ACHIEVEMENT UNLOCKED: ${m.name}`
                });
              }
            });

            // Show alerts
            const newAlerts = result.newly_unlocked.map((id, index) => ({
              id: Date.now() + index,
              message: `New Location Discovered! +${result.xp_gained} XP`
            })).concat(milestoneAlerts);
            
            setAlerts(prevAlerts => [...prevAlerts, ...newAlerts]);
            setTimeout(() => {
              setAlerts(prevAlerts => prevAlerts.filter(a => !newAlerts.find(na => na.id === a.id)));
            }, 4000);

            return {
              ...prev,
              xp: prev.xp + result.xp_gained,
              unlocked_locations: newUnlocked,
              badges: newBadges
            };
          });
          
          // Trigger flying XP animation
          const xpId = Date.now();
          setFlyingXp(prev => [...prev, { id: xpId, amount: result.xp_gained }]);
          setTimeout(() => {
            setFlyingXp(prev => prev.filter(xp => xp.id !== xpId));
          }, 2000);
          
          // Refresh map data to clear fog
          fetchMapData();
        }
      } catch (err) {
        console.error("Ping failed (possibly anti-spoofing rejection):", err);
      }
    }, 1500); // 1.5s debounce to allow "walking" with WASD before pinging

    return () => clearTimeout(pingTimer);
  }, [currentLocation, fetchMapData, USER_ID, token]);

  // Check for active landmark nearby
  useEffect(() => {
    if (!currentLocation || !mapData?.locations) return;
    
    let foundLandmark = null;
    for (const loc of mapData.locations) {
      if (loc.status !== "locked") {
        const dx = currentLocation.lng - loc.geometry.coordinates[0];
        const dy = currentLocation.lat - loc.geometry.coordinates[1];
        const distance = Math.sqrt(dx*dx + dy*dy);
        
        // Very small radius ~150 meters
        if (distance < 0.0015) {
          foundLandmark = loc;
          break;
        }
      }
    }
    setActiveLandmark(foundLandmark);
  }, [currentLocation, mapData]);

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
            setIsMoving(true);
            if (movementTimeoutRef.current) clearTimeout(movementTimeoutRef.current);
            movementTimeoutRef.current = setTimeout(() => setIsMoving(false), 1500);
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

  // Check local storage for auth on mount
  useEffect(() => {
    const savedAuth = localStorage.getItem('smartcity_auth');
    if (savedAuth) {
      const { username, explorerType, userId, token } = JSON.parse(savedAuth);
      // Re-hydrate state but don't call setUserId and setToken through handleLogin to avoid circular loops
      setUserId(userId);
      setToken(token);
      setExplorerType(explorerType);
      setUserState(prev => ({ ...prev, username }));
      setIsLoggedIn(true);
    }
  }, []);

  const handleLogin = ({ username, explorerType, userId, token }) => {
    setUserId(userId);
    setToken(token);
    setExplorerType(explorerType);
    setUserState(prev => ({ ...prev, username }));
    setIsLoggedIn(true);
    localStorage.setItem('smartcity_auth', JSON.stringify({ username, explorerType, userId, token }));
  };

  const handleLogout = () => {
    localStorage.removeItem('smartcity_auth');
    setIsLoggedIn(false);
    setUserId('');
    setToken('');
  };

  const handleVerificationComplete = () => {
    setIsVerifying(false);
    window.history.replaceState({}, document.title, "/");
  };

  if (isVerifying) {
    return <VerifyEmail token={verificationToken} onComplete={handleVerificationComplete} />;
  }

  if (!isLoggedIn) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  return (
    <div className="retro-frame">
      <div className={`app-container ${theme}-mode`}>
      <HUDComponent 
        user={userState} 
        onReportClick={() => setIsReportingModalOpen(true)} 
        onSuggestClick={() => setIsSuggestModalOpen(true)}
        theme={theme}
        toggleTheme={() => setTheme(prev => prev === 'light' ? 'dark' : 'light')}
        isMoving={isMoving}
        onLogout={handleLogout}
      >
        <MapComponent 
          currentLocation={currentLocation} 
          mapData={mapData} 
          theme={theme}
          activeLandmark={activeLandmark}
        />
        
        {/* Dev Mode Indicator */}
        {isManualMode && (
          <div className="pixel-panel" style={{
            position: 'absolute', bottom: 16, right: 16, zIndex: 1000, 
            padding: '8px', color: 'var(--text-yellow)'
          }}>
            WASD DEV MODE
          </div>
        )}

        {/* Active Landmark Info Panel */}
        {activeLandmark && (
          <div className="pixel-panel active-landmark-panel" style={{
            position: 'absolute', top: 16, left: '50%', transform: 'translateX(-50%)',
            zIndex: 1000, padding: '16px', minWidth: '300px', textAlign: 'center',
            boxShadow: 'var(--retro-shadow)', border: '4px solid var(--border-light)'
          }}>
            <h2 style={{ color: 'var(--accent-cyan)' }}>{activeLandmark.name}</h2>
            <p style={{ fontSize: '8px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
              Tier {activeLandmark.tier} Landmark
              {activeLandmark.rating && <span style={{ marginLeft: '8px', color: 'var(--text-yellow)' }}>⭐️ {activeLandmark.rating}</span>}
            </p>
            <div style={{ padding: '8px', backgroundColor: 'rgba(0,0,0,0.2)', marginBottom: '8px' }}>
              <p style={{ fontSize: '10px', marginBottom: activeLandmark.review_snippet ? '8px' : '0' }}>{activeLandmark.description}</p>
              {activeLandmark.review_snippet && (
                <p style={{ fontSize: '8px', color: 'var(--text-secondary)', fontStyle: 'italic', borderTop: '1px dashed var(--border-light)', paddingTop: '8px' }}>
                  "{activeLandmark.review_snippet}" - Google Review
                </p>
              )}
            </div>
            <p style={{ fontSize: '8px', color: 'var(--text-yellow)' }}>
              XP Reward: {activeLandmark.xp_reward}
            </p>
          </div>
        )}
      </HUDComponent>
      
      <CivicReportingModal 
        isOpen={isReportingModalOpen}
        onClose={() => setIsReportingModalOpen(false)}
        currentLocation={currentLocation}
        userId={USER_ID}
        onSuccess={fetchMapData}
      />

      <SuggestPlaceModal 
        isOpen={isSuggestModalOpen}
        onClose={() => setIsSuggestModalOpen(false)}
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
      
      {/* Flying XP Particles */}
      {flyingXp.map(xp => (
        <div key={xp.id} className="flying-xp">
          +{xp.amount} XP
        </div>
      ))}
    </div>
    </div>
  );
}

export default App;
