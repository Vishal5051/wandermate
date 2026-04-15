import React, { useState, useRef, useEffect } from 'react';
import Map, { Marker, NavigationControl } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';

const MAP_STYLE = 'https://tiles.openfreemap.org/styles/liberty';

function PersonalMap({ pins, onMapClick, onPinClick }) {
  const mapRef = useRef();
  const [viewState, setViewState] = useState({
    latitude: 30.0869,
    longitude: 78.2676,
    zoom: 12
  });

  useEffect(() => {
    if (pins.length > 0) {
      // Center on the most recent pin
      const latest = pins[0];
      setViewState(prev => ({
        ...prev,
        latitude: parseFloat(latest.latitude),
        longitude: parseFloat(latest.longitude)
      }));
    } else {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            setViewState(prev => ({
              ...prev,
              latitude: pos.coords.latitude,
              longitude: pos.coords.longitude
            }));
          }
        );
      }
    }
  }, [pins.length]); // only run when pins are loaded

  const handleClick = (e) => {
    if (onMapClick) {
      onMapClick({
        lat: e.lngLat.lat,
        lng: e.lngLat.lng
      });
    }
  };

  return (
    <div className="personal-map-container" style={{ width: '100%', height: '350px', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
      <Map
        {...viewState}
        onMove={evt => setViewState(evt.viewState)}
        ref={mapRef}
        mapStyle={MAP_STYLE}
        style={{ width: '100%', height: '100%' }}
        onClick={handleClick}
        attributionControl={false}
      >
        <NavigationControl position="bottom-right" />
        {pins.map(pin => (
          <Marker
            key={pin.id}
            latitude={parseFloat(pin.latitude)}
            longitude={parseFloat(pin.longitude)}
            anchor="bottom"
            onClick={e => {
              e.originalEvent.stopPropagation();
              if (onPinClick) onPinClick(pin);
            }}
          >
            <div className="journal-marker-emoji" style={{
              fontSize: '24px', 
              background: 'white', 
              borderRadius: '50%', 
              padding: '4px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
              cursor: 'pointer',
              border: '2px solid #3b82f6'
            }}>
              {pin.mood_emoji || '📍'}
            </div>
          </Marker>
        ))}
      </Map>
    </div>
  );
}

export default PersonalMap;
