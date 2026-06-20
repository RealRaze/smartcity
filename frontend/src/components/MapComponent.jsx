import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Polygon, Tooltip, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

function MapUpdater({ center }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom(), { animate: true });
  }, [center, map]);
  return null;
}

// Fix for default Leaflet icon issues in React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Custom Icons using divIcon with emojis
const createCustomIcon = (color, iconChar = '') => {
  return L.divIcon({
    className: 'custom-leaflet-icon',
    html: `<div style="
      background-color: ${color};
      width: 24px;
      height: 24px;
      border-radius: 50%;
      border: 2px solid white;
      box-shadow: 0 0 4px rgba(0,0,0,0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 12px;
    ">${iconChar}</div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
};

const userIcon = createCustomIcon('#06b6d4', '👤');
const tier1Icon = createCustomIcon('#f59e0b', '⭐'); // Gold Star
const tier2Icon = createCustomIcon('#3b82f6', '📍'); // Blue Pin
const lockedIcon = createCustomIcon('#6b7280', '❓'); // Padlock / Mystery
const gemIcon = createCustomIcon('#8e44ad', '💎'); // Purple Gem
const reportIcon = createCustomIcon('#ef4444', '🚧');

// Base fog styling options (without colors, which will be dynamic)
const baseThickFogOptions = {
  weight: 15, // Extra thick fuzzy border
  opacity: 0.5,
  className: "cloud-fog",
  color: "transparent", // border color
};

const baseSemiFogOptions = {
  weight: 0,
  className: "cloud-fog",
  color: "transparent", // border color
};

// Simplified outer bounds covering the whole world to act as fog
const outerBounds = [
  [-85, -180],
  [85, -180],
  [85, 180],
  [-85, 180],
];

export default function MapComponent({ currentLocation, mapData, theme, activeLandmark }) {
  // Leaflet doesn't auto-recenter when currentLocation changes like GMaps did out-of-the-box easily without an effect hook, 
  // but for a simple prototype, passing center to MapContainer is fine (it only centers on mount).
  const center = currentLocation ? [currentLocation.lat, currentLocation.lng] : [18.4636, 73.8682]; // VIT Pune

  // Create fog of war polygon holes based on discovered locations
  const thickHoles = [];
  const semiHoles = [];

  if (currentLocation) {
    thickHoles.push(generateCircleHole(currentLocation.lat, currentLocation.lng, 0.02)); // Large hole in outer thick clouds
    semiHoles.push(generateCircleHole(currentLocation.lat, currentLocation.lng, 0.005)); // Small hole in inner semi-transparent fog
  }
  


  // In Leaflet, a polygon with holes is an array where the first element is the outer ring, and subsequent elements are holes.
  const thickPaths = [outerBounds, ...thickHoles];
  const semiPaths = [outerBounds, ...semiHoles];

  const tileUrl = theme === 'dark' 
    ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
    : "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png";

  const dynamicThickFogOptions = {
    ...baseThickFogOptions,
    fillColor: theme === 'dark' ? '#334155' : '#94a3b8',
    fillOpacity: 0.95,
    color: theme === 'dark' ? '#475569' : '#cbd5e1',
  };

  const dynamicSemiFogOptions = {
    ...baseSemiFogOptions,
    fillColor: theme === 'dark' ? '#1e293b' : '#64748b',
    fillOpacity: 0.6,
  };

  return (
    <div className="map-container" style={{ width: '100%', height: '100%', position: 'relative' }}>
      <MapContainer 
        center={center} 
        zoom={15} 
        style={{ width: '100%', height: '100%', background: '#a0c8f0' }}
        zoomControl={false}
      >
        <MapUpdater center={center} />
        {/* Dynamic Tiles */}
        <TileLayer
          url={tileUrl}
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />

        {/* Thick Outer Clouds */}
        <Polygon positions={thickPaths} pathOptions={dynamicThickFogOptions} />
        
        {/* Semi-Transparent Inner Fog */}
        <Polygon positions={semiPaths} pathOptions={dynamicSemiFogOptions} />

        {/* Current Location Marker */}
        {currentLocation && (
          <Marker position={[currentLocation.lat, currentLocation.lng]} icon={userIcon}>
            <Tooltip>You are here</Tooltip>
          </Marker>
        )}

        {/* Map Data Markers */}
        {mapData?.locations?.map(loc => {
          let icon = tier2Icon;
          let opacity = 1.0;
          
          if (loc.tier === 1) icon = tier1Icon;
          if (loc.tier === 3) {
            if (loc.status === 'locked') {
              icon = lockedIcon;
              opacity = 0.2;
            } else {
              icon = gemIcon;
            }
          }
          
          return (
            <Marker 
              key={loc.id}
              position={[loc.geometry.coordinates[1], loc.geometry.coordinates[0]]}
              icon={icon}
              opacity={opacity}
            >
              {(loc.status !== 'locked' && activeLandmark && loc.id === activeLandmark.id) && (
                <Tooltip permanent direction="top" offset={[0, -12]} className="retro-tooltip">
                  {loc.name}
                </Tooltip>
              )}
            </Marker>
          );
        })}

        {/* Civic Reports */}
        {mapData?.civic_reports?.map(report => (
          <Marker 
            key={report.id}
            position={[report.geometry.coordinates[1], report.geometry.coordinates[0]]}
            icon={reportIcon}
          >
            <Tooltip>{report.description}</Tooltip>
          </Marker>
        ))}

      </MapContainer>
    </div>
  );
}

// Helper to generate a polygon hole (circle approximation)
function generateCircleHole(centerLat, centerLng, radiusDeg) {
  const points = 32;
  const hole = [];
  for (let i = points - 1; i >= 0; i--) {
    const theta = (i / points) * (2 * Math.PI);
    hole.push([
      centerLat + (radiusDeg * Math.cos(theta)),
      centerLng + (radiusDeg * Math.sin(theta))
    ]);
  }
  return hole;
}
