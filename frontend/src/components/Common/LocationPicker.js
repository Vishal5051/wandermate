import React, { useState, useRef, useEffect } from 'react';
import './LocationPicker.css';

// Note: You need to add Google Maps script to index.html:
// <script src="https://maps.googleapis.com/maps/api/js?key=YOUR_API_KEY&libraries=places"></script>

function LocationPicker({ onLocationSelect, initialValue = '' }) {
  const [inputValue, setInputValue] = useState(initialValue);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const inputRef = useRef(null);
  const autocompleteRef = useRef(null);

  useEffect(() => {
    if (!window.google) {
      console.error('Google Maps API not loaded');
      return;
    }

    // Initialize Google Places Autocomplete
    autocompleteRef.current = new window.google.maps.places.Autocomplete(
      inputRef.current,
      {
        types: ['geocode', 'establishment'],
        fields: ['formatted_address', 'geometry', 'name', 'place_id']
      }
    );

    // Listen for place selection
    autocompleteRef.current.addListener('place_changed', () => {
      const place = autocompleteRef.current.getPlace();

      if (!place.geometry) {
        console.error('No location details available');
        return;
      }

      const location = {
        name: place.formatted_address || place.name,
        latitude: place.geometry.location.lat(),
        longitude: place.geometry.location.lng(),
        placeId: place.place_id
      };

      setSelectedLocation(location);
      setInputValue(location.name);
      
      if (onLocationSelect) {
        onLocationSelect(location);
      }
    });

    return () => {
      if (autocompleteRef.current) {
        window.google.maps.event.clearInstanceListeners(autocompleteRef.current);
      }
    };
  }, [onLocationSelect]);

  const handleInputChange = (e) => {
    setInputValue(e.target.value);
    if (!e.target.value) {
      setSelectedLocation(null);
      if (onLocationSelect) {
        onLocationSelect(null);
      }
    }
  };

  const handleCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        
        // Reverse geocode to get address
        const geocoder = new window.google.maps.Geocoder();
        geocoder.geocode(
          { location: { lat: latitude, lng: longitude } },
          (results, status) => {
            if (status === 'OK' && results[0]) {
              const location = {
                name: results[0].formatted_address,
                latitude,
                longitude,
                placeId: results[0].place_id
              };

              setSelectedLocation(location);
              setInputValue(location.name);
              
              if (onLocationSelect) {
                onLocationSelect(location);
              }
            }
          }
        );
      },
      (error) => {
        console.error('Geolocation error:', error);
        alert('Unable to get your location');
      }
    );
  };

  return (
    <div className="location-picker">
      <div className="location-input-wrapper">
        <svg className="location-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
          <circle cx="12" cy="10" r="3"/>
        </svg>
        <input
          ref={inputRef}
          type="text"
          className="location-input"
          placeholder="Search location..."
          value={inputValue}
          onChange={handleInputChange}
        />
        {selectedLocation && (
          <button
            type="button"
            className="clear-location"
            onClick={() => {
              setInputValue('');
              setSelectedLocation(null);
              if (onLocationSelect) onLocationSelect(null);
            }}
          >
            ✕
          </button>
        )}
      </div>

      <button
        type="button"
        className="current-location-btn"
        onClick={handleCurrentLocation}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10"/>
          <circle cx="12" cy="12" r="3"/>
        </svg>
        Use Current Location
      </button>

      {selectedLocation && (
        <div className="selected-location-info">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
            <polyline points="22 4 12 14.01 9 11.01"/>
          </svg>
          <span>Location selected</span>
        </div>
      )}
    </div>
  );
}

export default LocationPicker;
