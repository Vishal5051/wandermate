import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import { useNavigate } from 'react-router-dom';
import L from 'leaflet';
import { activitiesAPI } from '../../utils/api';
import { MapPin, Settings, Bell, Plus, Navigation } from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import './MapView.css';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

const activityEmoji = {
  'Hike': '⛰️', 'Cafe': '☕', 'Night Out': '✨', 'Day Trip': '🚗',
  'Skill Share': '📚', 'Language Exchange': '💬', 'Yoga': '🧘', 'Other': '📍'
};

const activityColor = {
  'Hike': '#059669', 'Cafe': '#92400E', 'Night Out': '#7C3AED', 'Day Trip': '#EA580C',
  'Skill Share': '#2563EB', 'Language Exchange': '#EC4899', 'Yoga': '#059669', 'Other': '#6B7280'
};

function createActivityIcon(type) {
  const emoji = activityEmoji[type] || '📍';
  const bg = activityColor[type] || '#6B7280';
  return L.divIcon({
    html: `<div style="width:42px;height:42px;border-radius:12px;background:${bg};display:flex;align-items:center;justify-content:center;font-size:20px;box-shadow:0 2px 12px rgba(0,0,0,0.25);border:2px solid #fff">${emoji}</div>`,
    className: '',
    iconSize: [42, 42],
    iconAnchor: [21, 42],
    popupAnchor: [0, -42],
  });
}

function createUserIcon() {
  return L.divIcon({
    html: `<div style="width:18px;height:18px;border-radius:50%;background:#2563EB;border:3px solid #fff;box-shadow:0 0 0 2px #2563EB,0 2px 8px rgba(37,99,235,0.4)"></div>`,
    className: '',
    iconSize: [18, 18],
    iconAnchor: [9, 9],
  });
}

const RADIUS_KM = 5;
const RADIUS_METERS = RADIUS_KM * 1000;

function FlyToLocation({ position }) {
  const map = useMap();
  useEffect(() => {
    if (position) {
      map.flyTo([position.lat, position.lng], 14, { duration: 1.5 });
    }
  }, [map, position]);
  return null;
}

function MapView({ user, onLocationChange }) {
  const [position, setPosition] = useState(null);
  const [activities, setActivities] = useState([]);
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [locationName, setLocationName] = useState('Locating...');
  const navigate = useNavigate();
  const defaultPosition = [30.0869, 78.2676];

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setPosition(loc);
          if (onLocationChange) onLocationChange(loc);
          reverseGeocode(loc.lat, loc.lng);
        },
        () => {
          const loc = { lat: defaultPosition[0], lng: defaultPosition[1] };
          setPosition(loc);
          if (onLocationChange) onLocationChange(loc);
          setLocationName('Rishikesh');
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    } else {
      const loc = { lat: defaultPosition[0], lng: defaultPosition[1] };
      setPosition(loc);
      if (onLocationChange) onLocationChange(loc);
      setLocationName('Rishikesh');
    }
  }, []);

  const reverseGeocode = async (lat, lng) => {
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&zoom=10`);
      const data = await res.json();
      const city = data.address?.city || data.address?.town || data.address?.village || data.address?.county || 'Unknown';
      setLocationName(city);
    } catch {
      setLocationName('Current Location');
    }
  };

  useEffect(() => {
    if (position) fetchActivities();
  }, [position]);

  const fetchActivities = async () => {
    try {
      setLoading(true);
      const res = await activitiesAPI.getNearby(position.lat, position.lng, RADIUS_METERS);
      setActivities(res.data.activities || []);
    } catch (err) {
      console.error('Error fetching activities:', err);
    } finally {
      setLoading(false);
    }
  };

  const recenter = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setPosition(loc);
          if (onLocationChange) onLocationChange(loc);
          reverseGeocode(loc.lat, loc.lng);
        },
        () => {}
      );
    }
  };

  const mapCenter = position ? [position.lat, position.lng] : defaultPosition;

  return (
    <div className="map-page">
      {/* Top bar */}
      <div className="map-top-bar">
        <div className="location-badge">
          <MapPin size={16} className="location-badge-icon" />
          <span>{locationName}</span>
          <span className="radius-tag">{RADIUS_KM}km</span>
        </div>
        <div className="map-top-actions">
          <button className="map-icon-btn" onClick={recenter} title="Re-center">
            <Navigation size={18} />
          </button>
          <button className="map-icon-btn"><Bell size={18} /></button>
        </div>
      </div>

      {/* Map */}
      <div className="map-container">
        <MapContainer center={mapCenter} zoom={14} style={{ width: '100%', height: '100%' }} zoomControl={false}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          />
          <FlyToLocation position={position} />

          {/* 5km radius circle */}
          {position && (
            <Circle
              center={[position.lat, position.lng]}
              radius={RADIUS_METERS}
              pathOptions={{
                color: '#2563EB',
                fillColor: '#2563EB',
                fillOpacity: 0.06,
                weight: 1.5,
                dashArray: '6 4'
              }}
            />
          )}

          {/* User location marker */}
          {position && (
            <Marker position={[position.lat, position.lng]} icon={createUserIcon()}>
              <Popup>You are here</Popup>
            </Marker>
          )}

          {activities.map((act) => (
            <Marker
              key={act.id}
              position={[act.latitude, act.longitude]}
              icon={createActivityIcon(act.activity_type)}
              eventHandlers={{ click: () => setSelectedActivity(act) }}
            />
          ))}
        </MapContainer>
      </div>

      {/* Activity count badge */}
      {!loading && (
        <div className="map-activity-count">
          {activities.length} activit{activities.length !== 1 ? 'ies' : 'y'} nearby
        </div>
      )}

      {/* Bottom sheet preview */}
      {selectedActivity && (
        <div className="map-bottom-sheet">
          <div className="sheet-handle" />
          <div className="sheet-activity-row">
            <div className="sheet-activity-icon" style={{ background: activityColor[selectedActivity.activity_type] || '#6B7280' }}>
              {activityEmoji[selectedActivity.activity_type] || '📍'}
            </div>
            <div className="sheet-activity-info">
              <div className="sheet-activity-title">{selectedActivity.title}</div>
              <div className="sheet-activity-meta">
                <span>{selectedActivity.host_name}</span>
                {selectedActivity.host_verification === 'verified' && <span className="badge badge-verified">✓ Verified</span>}
              </div>
              <div className="sheet-activity-meta">
                <span>🕐 {new Date(selectedActivity.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                <span>📍 {selectedActivity.location_name}</span>
              </div>
            </div>
            <div className="sheet-capacity">{selectedActivity.current_attendees}/{selectedActivity.capacity}</div>
          </div>
          <button className="sheet-join-btn" onClick={() => navigate(`/activity/${selectedActivity.id}`)}>
            View Details
          </button>
        </div>
      )}

      {/* FAB */}
      <button className="map-fab" onClick={() => navigate('/create-activity')}>
        <Plus size={24} />
      </button>
    </div>
  );
}

export default MapView;
