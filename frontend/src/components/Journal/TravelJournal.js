import React, { useState, useEffect } from 'react';
import { pinsAPI } from '../../utils/api';
import './TravelJournal.css';

function TravelJournal({ user }) {
  const [pins, setPins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({
    title: '', note: '', location_name: '',
    latitude: '', longitude: '', mood_emoji: '😊',
    visit_date: new Date().toISOString().slice(0, 16)
  });

  useEffect(() => { fetchPins(); }, []);

  const fetchPins = async () => {
    try {
      setLoading(true);
      const res = await pinsAPI.getAll();
      setPins(res.data.pins);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await pinsAPI.create({
        ...formData,
        latitude: parseFloat(formData.latitude),
        longitude: parseFloat(formData.longitude)
      });
      setShowCreateModal(false);
      setFormData({ title: '', note: '', location_name: '', latitude: '', longitude: '', mood_emoji: '😊', visit_date: new Date().toISOString().slice(0, 16) });
      fetchPins();
    } catch (err) { alert('Failed to create journal entry'); }
  };

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

  const handleDelete = async (pinId) => {
    if (window.confirm('Delete this journal entry?')) {
      try { await pinsAPI.delete(pinId); fetchPins(); } catch (err) { alert('Failed to delete'); }
    }
  };

  if (loading) return <div className="journal-page" style={{display:'flex',alignItems:'center',justifyContent:'center',minHeight:'60vh'}}><div className="spinner"></div></div>;

  return (
    <div className="journal-page">
      {/* Top bar */}
      <div className="journal-top-bar">
        <h1>My Journal</h1>
        <div className="journal-top-actions">
          <button className="journal-icon-btn pin-btn">📍</button>
          <button className="journal-icon-btn grid-btn">📷</button>
        </div>
      </div>

      {/* Map placeholder */}
      <div className="journal-map-placeholder">
        🗺️ Journal map view coming soon
      </div>

      {/* Trip summary */}
      {pins.length > 0 && (
        <div className="journal-trip-summary">
          <div className="trip-summary-title">
            Rishikesh Adventure ⛰️
          </div>
          <div className="trip-summary-meta">
            {pins.length} pins · Private
          </div>
          <div className="trip-summary-tags">
            <span className="trip-tag pins">{pins.length} pins</span>
            <span className="trip-tag private">Private</span>
          </div>
          <div className="trip-actions">
            <button className="trip-action-btn view-timeline">View Timeline</button>
            <button className="trip-action-btn publish">Publish Trip</button>
          </div>
        </div>
      )}

      {/* Entries */}
      {pins.length === 0 ? (
        <div className="journal-empty">
          <div className="empty-icon">📍</div>
          <h3>No journal entries yet</h3>
          <p>Start documenting your travel memories!</p>
          <button className="btn btn-primary mt-3" onClick={() => setShowCreateModal(true)}>+ Add Entry</button>
        </div>
      ) : (
        <div className="journal-entries">
          <h2>Recent Entries</h2>
          {pins.map((pin) => (
            <div key={pin.id} className="pin-entry">
              <div className="pin-entry-header">
                <span className="pin-entry-date">
                  {new Date(pin.visit_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                </span>
                <button className="pin-entry-delete" onClick={() => handleDelete(pin.id)}>🗑️</button>
              </div>
              <div className="pin-entry-location">📍 {pin.location_name || 'Unknown location'}</div>
              {pin.title && <div className="pin-entry-title">{pin.title}</div>}
              {pin.note && <p className="pin-entry-note">{pin.note}</p>}
              {pin.mood_emoji && <div className="pin-entry-mood">{pin.mood_emoji}</div>}
            </div>
          ))}
        </div>
      )}

      {/* FAB */}
      <button className="journal-fab" onClick={() => setShowCreateModal(true)}>+</button>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Add Journal Entry</h2>
              <button className="modal-close-btn" onClick={() => setShowCreateModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmit} className="journal-form">
              <div className="form-group">
                <label className="form-label">TITLE (OPTIONAL)</label>
                <input type="text" name="title" className="form-input" value={formData.title} onChange={handleChange} placeholder="Give this memory a title" />
              </div>
              <div className="form-group">
                <label className="form-label">LOCATION NAME *</label>
                <input type="text" name="location_name" className="form-input" value={formData.location_name} onChange={handleChange} placeholder="e.g., Beatles Cafe, Tapovan" required />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">LATITUDE *</label>
                  <input type="number" name="latitude" className="form-input" value={formData.latitude} onChange={handleChange} step="0.000001" required />
                </div>
                <div className="form-group">
                  <label className="form-label">LONGITUDE *</label>
                  <input type="number" name="longitude" className="form-input" value={formData.longitude} onChange={handleChange} step="0.000001" required />
                </div>
              </div>
              <button type="button" onClick={getCurrentLocation} className="btn btn-secondary btn-full mb-2">📍 Use Current Location</button>
              <div className="form-group">
                <label className="form-label">VISIT DATE & TIME *</label>
                <input type="datetime-local" name="visit_date" className="form-input" value={formData.visit_date} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label className="form-label">NOTE</label>
                <textarea name="note" className="form-textarea" value={formData.note} onChange={handleChange} placeholder="What made this place special?" rows="3" maxLength="500" />
                <div className="char-count">{formData.note.length}/500</div>
              </div>
              <div className="form-group">
                <label className="form-label">MOOD</label>
                <div className="mood-selector">
                  {['😊', '😍', '🤔', '😌', '🥳', '😎', '🙏', '❤️'].map((emoji) => (
                    <button key={emoji} type="button" className={`mood-btn ${formData.mood_emoji === emoji ? 'selected' : ''}`}
                      onClick={() => setFormData({ ...formData, mood_emoji: emoji })}>{emoji}</button>
                  ))}
                </div>
              </div>
              <div className="modal-actions">
                <button type="button" onClick={() => setShowCreateModal(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary">Save Entry</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default TravelJournal;
