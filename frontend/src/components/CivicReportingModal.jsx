import React, { useState } from 'react';
import { X, Camera } from 'lucide-react';
import { civicService } from '../services/api';

export default function CivicReportingModal({ isOpen, onClose, currentLocation, userId, onSuccess }) {
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!description || !currentLocation) return;
    
    setIsSubmitting(true);
    try {
      await civicService.reportIncident({
        description,
        geometry: {
          type: "Point",
          coordinates: [currentLocation.lng, currentLocation.lat] // GeoJSON [lng, lat]
        },
        image_payload: "base64_mock_image",
        reporter_id: userId
      });
      setDescription('');
      onSuccess();
      onClose();
      
      // Redirect to Pune Municipality (PMC Care) portal
      window.open('https://pmc.gov.in/en/ptckms', '_blank');
    } catch (err) {
      console.error("Failed to submit report:", err);
      alert("Failed to submit report.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="pixel-panel modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>REPORT ISSUE</h2>
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
            <label>Description</label>
            <textarea 
              className="form-control" 
              placeholder="E.g., Pothole, Broken Streetlight, Graffiti..."
              value={description}
              onChange={e => setDescription(e.target.value)}
              required
            />
          </div>
          
          <div className="form-group">
            <button type="button" className="btn-secondary" style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              <Camera size={18} /> Add Photo (Simulated)
            </button>
          </div>
          
          <button 
            type="submit" 
            className="btn-primary" 
            style={{ width: '100%', marginTop: '16px' }}
            disabled={isSubmitting || !currentLocation}
          >
            {isSubmitting ? 'Submitting...' : 'Submit Report'}
          </button>
        </form>
      </div>
    </div>
  );
}
