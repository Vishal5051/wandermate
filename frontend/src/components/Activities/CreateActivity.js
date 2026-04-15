import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { activitiesAPI } from '../../utils/api';
import axios from 'axios';
import Map, { Marker } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import { MapPin, Search as SearchIcon, X, Map as MapIcon, ChevronLeft } from 'lucide-react';
import './Activities.css';

const MAP_STYLE = 'https://tiles.openfreemap.org/styles/liberty';

const activityTypes = [
  { value: 'Cafe', icon: '☕', label: 'Cafe' },
  { value: 'Hike', icon: '⛰️', label: 'Hike' },
  { value: 'Night Out', icon: '✨', label: 'Night Out' },
  { value: 'Day Trip', icon: '🚗', label: 'Day Trip' },
  { value: 'Skill Share', icon: '📚', label: 'Skill' },
];

const formatAddress = (feat) => {
  if (!feat || !feat.properties) return '';
  const p = feat.properties;
  const name = p.name || '';
  const city = p.city || p.district || p.town || '';
  const country = p.country || '';
  
  // Create unique parts
  const parts = [];
  if (name) parts.push(name);
  if (city && city !== name) parts.push(city);
  if (country && country !== city && country !== name) parts.push(country);
  
  return parts.join(', ');
};

function CreateActivity({ user }) {
  const [formData, setFormData] = useState({
    title: '', description: '', activity_type: 'Cafe',
    latitude: 30.0869, longitude: 78.2676, location_name: '',
    start_time: '', capacity: 6, gender_filter: 'all'
  });
  const [showMapPicker, setShowMapPicker] = useState(false);
  const [viewState, setViewState] = useState({
    latitude: 30.0869,
    longitude: 78.2676,
    zoom: 13
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showResults, setShowResults] = useState(false);
  
  const mapRef = useRef();
  const navigate = useNavigate();

  useEffect(() => { getCurrentLocation(); }, []);

  // Photon Autocomplete Search for Form
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

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const { latitude, longitude } = pos.coords;
          setFormData(prev => ({
            ...prev,
            latitude: Number(latitude.toFixed(6)),
            longitude: Number(longitude.toFixed(6))
          }));
          setViewState(prev => ({ ...prev, latitude, longitude }));
          
          // Reverse geocode to get city name
          try {
            const res = await axios.get(`https://photon.komoot.io/reverse?lon=${longitude}&lat=${latitude}`);
            const feat = res.data.features?.[0];
            if (feat) {
              const fullName = formatAddress(feat);
              setFormData(prev => ({ ...prev, location_name: fullName }));
              setSearchTerm(fullName);
            }
          } catch (err) { console.error(err); }
        },
        () => {}
      );
    }
  };

  const handleSelectPlace = (feat) => {
    const [lon, lat] = feat.geometry.coordinates;
    const fullName = formatAddress(feat);
    
    setFormData(prev => ({
      ...prev,
      location_name: fullName,
      latitude: lat,
      longitude: lon
    }));
    setViewState(prev => ({ ...prev, latitude: lat, longitude: lon }));
    setSearchTerm(fullName);
    setSearchResults([]);
    setShowResults(false);
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleMapClick = async (e) => {
    const { lat, lng } = e.lngLat;
    setFormData(prev => ({ ...prev, latitude: lat, longitude: lng }));
    
    // Reverse geocode to update location name
    try {
      const res = await axios.get(`https://photon.komoot.io/reverse?lon=${lng}&lat=${lat}`);
      const feat = res.data.features?.[0];
      if (feat) {
        const fullName = formatAddress(feat);
        setFormData(prev => ({ ...prev, location_name: fullName }));
        setSearchTerm(fullName);
      }
    } catch (err) { console.error(err); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!formData.latitude || !formData.longitude) { setError('Please select a valid location'); setLoading(false); return; }
    if (new Date(formData.start_time) <= new Date()) { setError('Start time must be in the future'); setLoading(false); return; }

    try {
      await activitiesAPI.create({
        ...formData,
        latitude: parseFloat(formData.latitude),
        longitude: parseFloat(formData.longitude),
        capacity: parseInt(formData.capacity)
      });
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create activity');
    } finally { setLoading(false); }
  };

  const getMinDateTime = () => {
    const now = new Date();
    now.setHours(now.getHours() + 1);
    return now.toISOString().slice(0, 16);
  };

  if (showMapPicker) {
    return (
      <div className="map-picker-full">
        <div className="map-picker-header">
          <button type="button" className="back-btn" onClick={() => setShowMapPicker(false)}>
            <ChevronLeft size={24} />
          </button>
          <div className="picker-info">
            <h3>Pick Location</h3>
            <p>{Number(formData.latitude).toFixed(4)}, {Number(formData.longitude).toFixed(4)}</p>
          </div>
          <button type="button" className="confirm-picker-btn" onClick={() => setShowMapPicker(false)}>
            Confirm 📍
          </button>
        </div>
        <div className="picker-map-container">
          <Map
            {...viewState}
            onMove={evt => setViewState(evt.viewState)}
            ref={mapRef}
            mapStyle={MAP_STYLE}
            onClick={handleMapClick}
            style={{ width: '100%', height: '100%' }}
          >
            <Marker latitude={Number(formData.latitude)} longitude={Number(formData.longitude)} anchor="bottom">
              <div className="picker-pin">📍</div>
            </Marker>
          </Map>
          <div className="picker-instruction">Tap on the map to set activity location</div>
        </div>
      </div>
    );
  }

  return (
    <div className="create-activity-container">
      <div className="create-activity-header">
        <h2>Host an Activity</h2>
        <button className="close-btn" onClick={() => navigate('/')}>✕</button>
      </div>
      <div className="progress-bar" style={{ width: '60%' }} />

      <form onSubmit={handleSubmit} className="activity-form">
        <label className="form-label">ACTIVITY TYPE</label>
        <div className="activity-type-selector">
          {activityTypes.map(t => (
            <div
              key={t.value}
              className={`type-chip ${formData.activity_type === t.value ? 'selected' : ''}`}
              onClick={() => setFormData({ ...formData, activity_type: t.value })}
            >
              <div className="type-chip-icon">{t.icon}</div>
              <span className="type-chip-label">{t.label}</span>
            </div>
          ))}
        </div>

        <div className="form-group">
          <label className="form-label">TITLE *</label>
          <input type="text" name="title" className="form-input" value={formData.title} onChange={handleChange}
            placeholder="Coffee at Beatles Cafe" maxLength={60} required />
          <div className="form-hint" style={{textAlign:'right'}}>{formData.title.length}/60</div>
        </div>

        <div className="form-group">
          <label className="form-label">LOCATION *</label>
          <div className="location-selection-grid">
            <div className="input-with-icon" style={{position:'relative', flex: 1}}>
              <span className="input-icon">🔍</span>
              <input 
                type="text" 
                name="location_name" 
                className="form-input" 
                style={{paddingLeft:44}}
                value={searchTerm} 
                onChange={(e) => setSearchTerm(e.target.value)} 
                onFocus={() => setShowResults(true)}
                placeholder="Search for a place..." 
                autoComplete="off"
                required 
              />
              {showResults && searchResults.length > 0 && (
                <div className="form-search-results">
                  {searchResults.map((feat, i) => (
                    <div key={i} className="form-search-item" onClick={() => handleSelectPlace(feat)}>
                      <MapPin size={16} />
                      <span>{feat.properties.name}, {feat.properties.city || feat.properties.country}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <button type="button" className="btn-icon-map" onClick={() => setShowMapPicker(true)}>
              <MapIcon size={20} />
            </button>
          </div>
          <div className="location-coords-badge">
             📍 {Number(formData.latitude).toFixed(4)}, {Number(formData.longitude).toFixed(4)}
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">DATE & TIME *</label>
            <input type="datetime-local" name="start_time" className="form-input"
              value={formData.start_time} onChange={handleChange} min={getMinDateTime()} required />
          </div>
          <div className="form-group">
            <label className="form-label">CAPACITY *</label>
            <div className="capacity-control">
              <button type="button" className="capacity-btn"
                onClick={() => setFormData(p => ({ ...p, capacity: Math.max(2, p.capacity - 1) }))}>−</button>
              <span className="capacity-value">{formData.capacity}</span>
              <button type="button" className="capacity-btn"
                onClick={() => setFormData(p => ({ ...p, capacity: Math.min(50, p.capacity + 1) }))}>+</button>
            </div>
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">DESCRIPTION</label>
          <textarea name="description" className="form-textarea" value={formData.description}
            onChange={handleChange} placeholder="Tell people what to expect..." rows="3" />
        </div>

        <button type="button" onClick={getCurrentLocation} className="btn btn-secondary btn-full mb-2">
          📍 Use Current Location
        </button>

        <div className="toggle-row">
          <div className="toggle-info">
            <h4>Women-Only Event 🛡️</h4>
            <p>Only visible to verified women</p>
          </div>
          <label className="toggle-switch">
            <input type="checkbox" checked={formData.gender_filter === 'female'}
              onChange={(e) => setFormData({ ...formData, gender_filter: e.target.checked ? 'female' : 'all' })} />
            <span className="toggle-slider" />
          </label>
        </div>

        {error && <div className="form-error" style={{marginTop:16}}>{error}</div>}

        <button type="submit" className="btn btn-primary btn-full" style={{marginTop:24}} disabled={loading}>
          {loading ? 'Creating...' : 'Create Activity 🎯'}
        </button>
      </form>
    </div>
  );
}

export default CreateActivity;
