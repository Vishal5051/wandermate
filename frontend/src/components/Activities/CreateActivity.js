import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { activitiesAPI } from '../../utils/api';
import './Activities.css';

const activityTypes = [
  { value: 'Cafe', icon: '☕', label: 'Cafe' },
  { value: 'Hike', icon: '⛰️', label: 'Hike' },
  { value: 'Night Out', icon: '✨', label: 'Night Out' },
  { value: 'Day Trip', icon: '🚗', label: 'Day Trip' },
  { value: 'Skill Share', icon: '📚', label: 'Skill' },
];

function CreateActivity({ user }) {
  const [formData, setFormData] = useState({
    title: '', description: '', activity_type: 'Cafe',
    latitude: '', longitude: '', location_name: '',
    start_time: '', capacity: 6, gender_filter: 'all'
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => { getCurrentLocation(); }, []);

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setFormData(prev => ({
          ...prev,
          latitude: pos.coords.latitude.toFixed(6),
          longitude: pos.coords.longitude.toFixed(6)
        })),
        () => {}
      );
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!formData.latitude || !formData.longitude) { setError('Please provide a location'); setLoading(false); return; }
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

  return (
    <div className="create-activity-container">
      <div className="create-activity-header">
        <h2>Host an Activity</h2>
        <button className="close-btn" onClick={() => navigate('/')}>✕</button>
      </div>
      <div className="progress-bar" style={{ width: '60%' }} />

      <form onSubmit={handleSubmit} className="activity-form">
        {/* Activity type */}
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
          <div className="input-with-icon">
            <span className="input-icon">📍</span>
            <input type="text" name="location_name" className="form-input" style={{paddingLeft:44}}
              value={formData.location_name} onChange={handleChange} placeholder="Beatles Cafe, Tapovan" required />
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

        {/* Lat/Lng hidden but functional */}
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">LATITUDE *</label>
            <input type="number" name="latitude" className="form-input" value={formData.latitude}
              onChange={handleChange} step="0.000001" required />
          </div>
          <div className="form-group">
            <label className="form-label">LONGITUDE *</label>
            <input type="number" name="longitude" className="form-input" value={formData.longitude}
              onChange={handleChange} step="0.000001" required />
          </div>
        </div>

        <button type="button" onClick={getCurrentLocation} className="btn btn-secondary btn-full mb-2">
          📍 Use Current Location
        </button>

        {/* Women only toggle */}
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

