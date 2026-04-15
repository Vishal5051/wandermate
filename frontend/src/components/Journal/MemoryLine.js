import React from 'react';
import { MapPin, Calendar, Trash2 } from 'lucide-react';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

function MemoryLine({ pins, onDeletePin }) {
  if (!pins || pins.length === 0) {
    return (
      <div className="memory-line-empty">
        <div className="empty-icon">🌟</div>
        <h3>No Memories Yet</h3>
        <p>Start pinning your favorite spots to build your travel timeline.</p>
      </div>
    );
  }

  return (
    <div className="memory-line-container">
      {pins.map((pin, index) => {
        let photos = [];
        try {
          if (pin.photos) {
             photos = typeof pin.photos === 'string' ? JSON.parse(pin.photos) : pin.photos;
          }
        } catch(e) {
          console.error("Failed to parse photos", e);
        }
        
        return (
          <div key={pin.id} className="memory-item" id={`pin-${pin.id}`}>
            <div className="memory-timeline-connector">
              <div className="memory-dot">
                {pin.mood_emoji || '📍'}
              </div>
              {index !== pins.length - 1 && <div className="memory-line-stroke"></div>}
            </div>

            <div className="memory-content-card">
              <div className="memory-card-header">
                <div className="memory-meta">
                  <div className="memory-date">
                    <Calendar size={14} className="meta-icon" />
                    {new Date(pin.visit_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </div>
                  <div className="memory-location">
                    <MapPin size={14} className="meta-icon" />
                    {pin.location_name || 'Unknown Location'}
                  </div>
                </div>
                {onDeletePin && (
                  <button className="memory-delete-btn" onClick={() => onDeletePin(pin.id)} title="Delete Memory">
                    <Trash2 size={16} />
                  </button>
                )}
              </div>

              {pin.title && <h3 className="memory-title">{pin.title}</h3>}
              
              {pin.note && <p className="memory-note">{pin.note}</p>}

              {photos && photos.length > 0 && (
                <div className="memory-photo-gallery">
                  {photos.map((photo, i) => (
                    <img 
                      key={i}
                      src={`${API_URL}${photo}`} 
                      alt={`Memory captured at ${pin.location_name}`}
                      className="memory-photo"
                      loading="lazy"
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default MemoryLine;
