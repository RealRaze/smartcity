import React, { useState } from 'react';
import { locationService } from '../services/api';

export default function SuggestPlaceModal({ isOpen, onClose, currentLocation, userId, onSuccess }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [siteType, setSiteType] = useState('3'); // Default to Hidden Gem
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !description || !currentLocation) return;
    
    setIsSubmitting(true);
    
    // Determine tier attributes based on user selection
    const tierConfig = {
      '1': { type: 'landmark', tier: 1, xp_reward: 500, status: 'unlocked' },
      '2': { type: 'local_favorite', tier: 2, xp_reward: 250, status: 'unlocked' },
      '3': { type: 'hidden_gem', tier: 3, xp_reward: 100, status: 'locked' }
    };
    
    const config = tierConfig[siteType];

    try {
      await locationService.suggestLocation({
        name,
        type: config.type,
        description,
        geometry: {
          type: "Point",
          coordinates: [currentLocation.lng, currentLocation.lat]
        },
        tier: config.tier,
        xp_reward: config.xp_reward,
        status: config.status
      });
      setName('');
      setDescription('');
      setSiteType('3');
      onSuccess();
      onClose();
      alert(`Place suggested successfully! It has been sent for community validation.`);
    } catch (err) {
      console.error("Failed to suggest place:", err);
      alert("Failed to suggest place.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="pixel-panel modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>SUGGEST A LOCATION</h2>
          <button className="btn-secondary" style={{ padding: '6px' }} onClick={onClose}>
            X
          </button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Location</label>
            <div className="form-control" style={{ opacity: 0.7 }}>
              {currentLocation ? `${currentLocation.lat.toFixed(5)}, ${currentLocation.lng.toFixed(5)}` : 'Waiting for GPS...'}
            </div>
          </div>
          
          <div className="form-group">
            <label>Site Type</label>
            <select 
              className="form-control" 
              value={siteType} 
              onChange={e => setSiteType(e.target.value)}
            >
              <option value="1">⭐ Star Site (Major Landmark)</option>
              <option value="2">📍 Pin Site (Local Favorite)</option>
              <option value="3">❓ Question Mark (Hidden Gem)</option>
            </select>
          </div>

          <div className="form-group">
            <label>Place Name</label>
            <input 
              type="text"
              className="form-control" 
              placeholder="E.g., Secret Rooftop Cafe"
              value={name}
              onChange={e => setName(e.target.value)}
              required
            />
          </div>
          
          <div className="form-group">
            <label>Description</label>
            <textarea 
              className="form-control" 
              placeholder="Why is this place special?"
              value={description}
              onChange={e => setDescription(e.target.value)}
              required
            />
          </div>
          
          <button 
            type="submit" 
            className="btn-primary" 
            style={{ width: '100%', marginTop: '16px' }}
            disabled={isSubmitting || !currentLocation}
          >
            {isSubmitting ? 'Submitting...' : 'Suggest Place'}
          </button>
        </form>
      </div>
    </div>
  );
}
