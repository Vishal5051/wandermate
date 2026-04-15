import React, { useState, useEffect, useCallback, useRef } from 'react';
import Map, { Marker, NavigationControl, GeolocateControl } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useNavigate } from 'react-router-dom';
import { activitiesAPI, pinsAPI } from '../../utils/api';
import { MapPin, Settings, Bell, Plus, Navigation, Search as SearchIcon, X, Map as MapIcon, Image as ImageIcon } from 'lucide-react';
import axios from 'axios';
import CreatePinModal from '../Journal/CreatePinModal';
import './MapView.css';

const activityEmoji = {
  'Hike': '⛰️', 'Cafe': '☕', 'Night Out': '✨', 'Yoga': '🧘', 'Food Tour': '🍜',
  'Arts': '🎨', 'Photography': '📸', 'Weekend Trip': '🎒', 'Sports': '🏀',
  'Spiritual': '🛕', 'Community': '🤝', 'Other': '📍'
};

const activityColor = {
  'Hike': '#059669', 'Cafe': '#92400E', 'Night Out': '#7C3AED', 'Yoga': '#10B981',
  'Food Tour': '#F59E0B', 'Arts': '#EC4899', 'Photography': '#6366F1',
  'Weekend Trip': '#F97316', 'Sports': '#3B82F6', 'Spiritual': '#8B5CF6',
  'Community': '#14B8A6', 'Other': '#6B7280'
};

// OpenFreeMap Liberty style (very clean, resembles Snapchat/premium styles)
const MAP_STYLE = 'https://tiles.openfreemap.org/styles/liberty';
const RADIUS_KM = 50;

const formatAddress = (feat) => {
  if (!feat || !feat.properties) return '';
  const p = feat.properties;
  const name = p.name || '';
  const city = p.city || p.district || p.town || '';
  const country = p.country || '';
  
  const parts = [];
  if (name) parts.push(name);
  if (city && city !== name) parts.push(city);
  if (country && country !== city && country !== name) parts.push(country);
  
  return parts.join(', ');
};

function MapView({ user, onLocationChange }) {
  const [viewState, setViewState] = useState({
    latitude: 30.0869,
    longitude: 78.2676,
    zoom: 13
  });
  const [activities, setActivities] = useState([]);
  const [userPins, setUserPins] = useState([]);
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [selectedPin, setSelectedPin] = useState(null);
  const [loading, setLoading] = useState(false);
  const [locationName, setLocationName] = useState('Locating...');
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinLocation, setPinLocation] = useState(null);
  const [isPinningMode, setIsPinningMode] = useState(false);
  const [showActivitiesList, setShowActivitiesList] = useState(false);
  
  const mapRef = useRef();
  const navigate = useNavigate();
  const lastFetchCoords = useRef({ lat: 0, lng: 0 });
  const fetchTimeout = useRef(null);

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI/180) * Math.cos(lat2 * Math.PI/180) * 
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const fetchData = async (lat, lng) => {
    // Only fetch if moved more than 5km from last fetch
    const dist = calculateDistance(lat, lng, lastFetchCoords.current.lat, lastFetchCoords.current.lng);
    if (dist < 5 && activities.length > 0) return;

    try {
      setLoading(true);
      lastFetchCoords.current = { lat, lng };
      const [activitiesRes, pinsRes] = await Promise.all([
        activitiesAPI.getNearby(lat, lng, RADIUS_KM * 1000),
        pinsAPI.getAll(lat, lng, RADIUS_KM * 1000)
      ]);
      setActivities(activitiesRes.data.activities || []);
      setUserPins(pinsRes.data.pins || []);
    } catch (err) {
      console.error('Error fetching map data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Load data with debounce when position changes
  useEffect(() => {
    if (fetchTimeout.current) clearTimeout(fetchTimeout.current);
    fetchTimeout.current = setTimeout(() => {
      fetchData(viewState.latitude, viewState.longitude);
    }, 500);

    return () => { if (fetchTimeout.current) clearTimeout(fetchTimeout.current); };
  }, [viewState.latitude, viewState.longitude]);

  // Initial location fetch
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const loc = { latitude: pos.coords.latitude, longitude: pos.coords.longitude, zoom: 13 };
          setViewState(loc);
          if (onLocationChange) onLocationChange({ lat: loc.latitude, lng: loc.longitude });
          reverseGeocode(loc.latitude, loc.longitude);
        },
        () => {
          setLocationName('Rishikesh');
        }
      );
    }
  }, []);

  const reverseGeocode = async (lat, lon) => {
    try {
      const res = await axios.get(`https://photon.komoot.io/reverse?lon=${lon}&lat=${lat}`);
      const feat = res.data.features?.[0];
      if (feat) {
        const fullName = formatAddress(feat);
        setLocationName(fullName);
      }
    } catch (err) {
      console.error('Reverse geocode error:', err);
    }
  };


  // Photon Autocomplete Search
  useEffect(() => {
    if (searchTerm.length < 3) {
      setSearchResults([]);
      return;
    }
    const delayDebounceFn = setTimeout(async () => {
      try {
        const res = await axios.get(`https://photon.komoot.io/api/?q=${searchTerm}&limit=5`);
        setSearchResults(res.data.features || []);
        setShowResults(true);
      } catch (err) {
        console.error('Search error:', err);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  const handleSelectPlace = (feat) => {
    const [lon, lat] = feat.geometry.coordinates;
    const newLoc = { latitude: lat, longitude: lon, zoom: 14 };
    setViewState(newLoc);
    if (onLocationChange) onLocationChange({ lat, lng: lon });
    
    // Format display name
    const fullName = formatAddress(feat);
    setLocationName(fullName);
    
    setSearchTerm('');
    setSearchResults([]);
    setShowResults(false);
    
    if (mapRef.current) {
      mapRef.current.getMap().flyTo({ center: [lon, lat], duration: 2000 });
    }
  };

  const recenter = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        const loc = { latitude: pos.coords.latitude, longitude: pos.coords.longitude, zoom: 14 };
        setViewState(loc);
        if (mapRef.current) {
          mapRef.current.getMap().flyTo({ center: [loc.longitude, loc.latitude], duration: 1500 });
        }
        reverseGeocode(loc.latitude, loc.longitude);
      });
    }
  };

  return (
    <div className="map-page immersion-theme">
      {/* Pinning Mode Overlay */}
      {isPinningMode && (
        <div className="pinning-mode-banner">
          Tap anywhere on the map to drop your memory pin
          <button className="cancel-pinning-btn" onClick={() => setIsPinningMode(false)}>Cancel</button>
        </div>
      )}

      {/* Search & Location Bar */}
      <div className={`map-top-container ${isPinningMode ? 'hidden-ui' : ''}`}>
        <div className="search-bar-outer">
          <div className="search-bar-wrapper">
            <div className="search-icon-box">
              <SearchIcon size={20} className="search-icon" />
            </div>
            <input
              type="text"
              placeholder="Where to next?"
              className="map-search-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onFocus={() => setShowResults(true)}
            />
            {searchTerm && (
              <button className="clear-search" onClick={() => setSearchTerm('')}>
                <X size={18} />
              </button>
            )}
          </div>
          
          {/* Autocomplete Results */}
          {showResults && searchResults.length > 0 && (
            <div className="search-results-dropdown">
              {searchResults.map((feat, i) => (
                <div key={i} className="search-result-item" onClick={() => handleSelectPlace(feat)}>
                  <MapPin size={16} className="item-icon" />
                  <div className="item-text">
                    <div className="item-name">{feat.properties.name}</div>
                    <div className="item-sub">
                      {[feat.properties.city, feat.properties.state, feat.properties.country].filter(Boolean).join(', ')}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div className="location-pill" onClick={recenter}>
          <Navigation size={14} className="pill-icon" />
          <span>{locationName}</span>
        </div>
      </div>

      {/* Floating Buttons */}
      <div className={`side-actions ${isPinningMode ? 'hidden-ui' : ''}`}>
        <button className="action-btn" onClick={recenter} title="My Location">
          <MapIcon size={20} />
        </button>
        <button className="action-btn"><Bell size={20} /></button>
      </div>

      {/* Map Canvas */}
      <div className="map-canvas">
        <Map
          {...viewState}
          onMove={evt => setViewState(evt.viewState)}
          ref={mapRef}
          mapStyle={MAP_STYLE}
          style={{ width: '100%', height: '100%', cursor: isPinningMode ? 'crosshair' : 'grab' }}
          attributionControl={false}
          onClick={(e) => {
            if (isPinningMode) {
              setPinLocation({ lat: e.lngLat.lat, lng: e.lngLat.lng });
              setShowPinModal(true);
              setIsPinningMode(false);
            }
          }}
        >
          {/* Activity Markers */}
          {activities.map((act) => (
            <Marker
              key={act.id}
              latitude={parseFloat(act.latitude)}
              longitude={parseFloat(act.longitude)}
              anchor="bottom"
              onClick={e => {
                e.originalEvent.stopPropagation();
                setSelectedActivity(act);
              }}
            >
              <div className="premium-marker" style={{ background: activityColor[act.activity_type] || '#6B7280' }}>
                {activityEmoji[act.activity_type] || '📍'}
              </div>
            </Marker>
          ))}

          {/* User Specific Private Pins */}
          {userPins.map((pin) => (
            <Marker
              key={`pin-${pin.id}`}
              latitude={parseFloat(pin.latitude)}
              longitude={parseFloat(pin.longitude)}
              anchor="bottom"
              onClick={e => {
                e.originalEvent.stopPropagation();
                setSelectedPin(pin);
              }}
            >
              <div className="premium-marker pin-marker">
                {pin.mood_emoji || '📍'}
              </div>
            </Marker>
          ))}

          {/* User Location Marker */}
          <GeolocateControl position="bottom-right" />
        </Map>
      </div>

      {/* Status Pill */}
      {!loading && activities.length > 0 && (
        <div className="activity-status-pill clickable" onClick={() => setShowActivitiesList(true)}>
          <div className="status-dot" />
          <span>{activities.length} WanderMates nearby</span>
        </div>
      )}

      {/* Activities List Drawer */}
      {showActivitiesList && (
        <div className={`activities-list-drawer ${showActivitiesList ? 'open' : ''}`}>
          <div className="drawer-header">
            <div className="drawer-drag-handle" onClick={() => setShowActivitiesList(false)} />
            <h3>Nearby WanderMates</h3>
            <button className="close-drawer" onClick={() => setShowActivitiesList(false)}><X size={20}/></button>
          </div>
          <div className="drawer-content">
            {activities.map(act => (
              <div key={act.id} className="activity-card-mini" onClick={() => {
                setViewState({ latitude: parseFloat(act.latitude), longitude: parseFloat(act.longitude), zoom: 15 });
                setSelectedActivity(act);
                setShowActivitiesList(false);
              }}>
                <div className="card-left">
                  <div className="card-type-icon" style={{ background: activityColor[act.activity_type] }}>
                    {activityEmoji[act.activity_type]}
                  </div>
                </div>
                <div className="card-center">
                  <div className="card-title">{act.title}</div>
                  <div className="card-host">
                    Host: {act.host_name} 
                    {act.host_verification === 'verified' && <span className="sheet-verified-badge" style={{marginLeft:6}}>✓</span>}
                  </div>
                  <div className="card-meta">
                    <span>{new Date(act.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    <span className="dot">•</span>
                    <span>{act.current_attendees}/{act.capacity} joined</span>
                  </div>
                </div>
                <div className="card-right">
                   <button className="btn-join-mini" onClick={(e) => {
                     e.stopPropagation();
                     navigate(`/activity/${act.id}`);
                   }}>Join</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Snapchat Bottom Sheet */}
      {selectedActivity && (
        <div className="snap-bottom-sheet">
          <div className="sheet-header">
            <div className="sheet-drag-handle" onClick={() => setSelectedActivity(null)} />
          </div>
          <div className="sheet-body">
            <div className="sheet-main-info">
              <div className="sheet-activity-avatar" style={{ background: activityColor[selectedActivity.activity_type] || '#6B7280' }}>
                {activityEmoji[selectedActivity.activity_type] || '📍'}
              </div>
              <div className="sheet-text-content">
                <h3 className="sheet-title">{selectedActivity.title}</h3>
                <p className="sheet-subtitle">
                  Host: {selectedActivity.host_name} 
                  {selectedActivity.host_verification === 'verified' && <span className="sheet-verified-badge">✓ Verified</span>}
                </p>
              </div>
              <div className="sheet-attendee-badge">
                {selectedActivity.current_attendees}/{selectedActivity.capacity}
              </div>
            </div>
            <div className="sheet-meta-grid">
              <div className="meta-item">
                <span className="meta-label">Time</span>
                <span className="meta-value">{new Date(selectedActivity.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
              <div className="meta-item">
                <span className="meta-label">Type</span>
                <span className="meta-value">{selectedActivity.activity_type}</span>
              </div>
            </div>
            <button className="sheet-action-btn" onClick={() => navigate(`/activity/${selectedActivity.id}`)}>
              View Details
            </button>
          </div>
        </div>
      )}

      {/* Pin Details Bottom Sheet */}
      {selectedPin && (
        <div className="snap-bottom-sheet pin-details-sheet">
          <div className="sheet-header">
            <div className="sheet-drag-handle" onClick={() => setSelectedPin(null)} />
          </div>
          <div className="sheet-body">
            <div className="sheet-main-info">
              <div className="sheet-activity-avatar pin-avatar">
                {selectedPin.mood_emoji || '📍'}
              </div>
              <div className="sheet-text-content">
                <h3 className="sheet-title">{selectedPin.title || 'Personal Memory'}</h3>
                <p className="sheet-subtitle">{selectedPin.location_name}</p>
              </div>
              <div className="sheet-date-badge">
                {new Date(selectedPin.visit_date).toLocaleDateString()}
              </div>
            </div>
            {selectedPin.note && <p className="sheet-description">{selectedPin.note}</p>}
            <button className="sheet-action-btn" onClick={() => navigate('/journal')}>
              Open in Journal
            </button>
          </div>
        </div>
      )}

      {/* Floating Action Buttons Container */}
      <div className={`fab-container ${isPinningMode ? 'hidden-ui' : ''}`}>
        <button className="snap-fab pin-fab" onClick={() => {
          setIsPinningMode(true);
        }} title="Drop a Pin">
          <MapPin size={24} />
        </button>
        
        <button className="snap-fab" onClick={() => navigate('/create-activity')} title="Create Event">
          <Plus size={28} />
        </button>
      </div>

      {/* Create Pin Modal */}
      {showPinModal && (
        <CreatePinModal 
          onClose={() => setShowPinModal(false)}
          onSuccess={() => {
            alert('Memory saved successfully! View it in your Journal.');
          }}
          initialLocation={pinLocation}
        />
      )}
    </div>
  );
}

export default MapView;
