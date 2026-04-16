import React, { useState, useEffect } from 'react';
import { pinsAPI } from '../../utils/api';
import { X, Image as ImageIcon, MapPin, Calendar, Type, StickyNote, Smile, Navigation } from 'lucide-react';
import './TravelJournal.css';

function CreatePinModal({ onClose, onSuccess, initialLocation }) {
  const [formData, setFormData] = useState({
    title: '', 
    note: '', 
    location_name: '',
    latitude: initialLocation?.lat ? initialLocation.lat.toFixed(6) : '', 
    longitude: initialLocation?.lng ? initialLocation.lng.toFixed(6) : '', 
    mood_emoji: '📍',
    visit_date: new Date().toISOString().slice(0, 16),
    images: []
  });
  
  const [imagePreviews, setImagePreviews] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (initialLocation) {
      setFormData(prev => ({
        ...prev,
        latitude: initialLocation.lat.toFixed(6),
        longitude: initialLocation.lng.toFixed(6)
      }));
    }
  }, [initialLocation]);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length + formData.images.length > 5) {
      alert('You can only upload up to 5 images per entry.');
      return;
    }
    const newPreviews = files.map(file => URL.createObjectURL(file));
    setFormData({
      ...formData,
      images: [...formData.images, ...files]
    });
    setImagePreviews([...imagePreviews, ...newPreviews]);
  };

  const removeImage = (index) => {
    const defaultImages = [...formData.images];
    defaultImages.splice(index, 1);
    const newPreviews = [...imagePreviews];
    URL.revokeObjectURL(newPreviews[index]);
    newPreviews.splice(index, 1);
    setFormData({ ...formData, images: defaultImages });
    setImagePreviews(newPreviews);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    try {
      const data = new FormData();
      data.append('title', formData.title || '');
      data.append('note', formData.note || '');
      data.append('location_name', formData.location_name);
      data.append('latitude', formData.latitude || 0);
      data.append('longitude', formData.longitude || 0);
      data.append('mood_emoji', formData.mood_emoji);
      data.append('visit_date', formData.visit_date);
      
      formData.images.forEach(img => {
        data.append('images', img);
      });

      await pinsAPI.create(data);
      onSuccess();
      handleClose();
    } catch (err) { 
      alert('Failed to save memory: ' + (err.response?.data?.error || err.message)); 
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    imagePreviews.forEach(url => URL.revokeObjectURL(url));
    onClose();
  };

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

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          
          setFormData(prev => ({
            ...prev,
            latitude: lat.toFixed(6),
            longitude: lng.toFixed(6)
          }));

          // Reverse geocode to get city name
          try {
            const res = await fetch(`https://photon.komoot.io/reverse?lon=${lng}&lat=${lat}`);
            const data = await res.json();
            const feat = data.features?.[0];
            if (feat) {
              const fullName = formatAddress(feat);
              setFormData(prev => ({ ...prev, location_name: fullName }));
            }
          } catch (e) { console.error(e); }
        },
        () => alert('Could not get actual location.')
      );
    } else {
      alert('Geolocation is not supported by this browser.');
    }
  };

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content glass-modal" onClick={(e) => e.stopPropagation()} style={{maxWidth: 500}}>
        <div className="modal-header">
          <h2>Capture a Memory</h2>
          <button type="button" className="modal-close-btn" onClick={handleClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="journal-form">
          <div className="location-badge">
            <MapPin size={16} />
            <span>{Number(formData.latitude).toFixed(4)}, {Number(formData.longitude).toFixed(4)}</span>
            <button type="button" onClick={getCurrentLocation} className="btn-icon-inline" title="Use current location">
              <Navigation size={14} />
            </button>
          </div>

          <div className="photo-upload-container">
            <label className="photo-upload-btn">
              <input type="file" multiple accept="image/*" onChange={handleImageChange} style={{ display: 'none' }} />
              <div className="upload-icon-wrapper">
                <ImageIcon size={40} />
              </div>
              <span style={{fontWeight: 800, color: 'var(--text-main)'}}>Add Photos</span>
              <span style={{fontSize: 12, marginTop: 4}}>Share up to 5 special moments</span>
            </label>
            {imagePreviews.length > 0 && (
              <div className="image-previews">
                {imagePreviews.map((src, index) => (
                  <div key={index} className="preview-item">
                    <img src={src} alt="Preview" />
                    <button type="button" className="remove-preview" onClick={() => removeImage(index)}>
                      <X size={12} strokeWidth={3} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="form-grid">
            <div className="form-group">
              <label className="form-label"><Type size={14} style={{verticalAlign:'middle', marginRight:'4px'}}/> TITLE</label>
              <input type="text" name="title" className="form-input" value={formData.title} onChange={handleChange} placeholder="Morning Magic, etc." />
            </div>

            <div className="form-group">
              <label className="form-label"><MapPin size={14} style={{verticalAlign:'middle', marginRight:'4px'}}/> LOCATION NAME *</label>
              <input type="text" name="location_name" className="form-input" value={formData.location_name} onChange={handleChange} placeholder="Where was this?" required />
            </div>
            
            <div className="form-group">
              <label className="form-label"><Calendar size={14} style={{verticalAlign:'middle', marginRight:'6px'}}/> DATE & TIME *</label>
              <input type="datetime-local" name="visit_date" className="form-input" value={formData.visit_date} onChange={handleChange} required />
            </div>

            <div className="form-group">
              <label className="form-label"><StickyNote size={14} style={{verticalAlign:'middle', marginRight:'6px'}}/> TELL THE STORY</label>
              <textarea name="note" className="form-input" value={formData.note} onChange={handleChange} placeholder="Write something special about this moment..." rows="4" maxLength="500" />
              <div className="char-count">{formData.note.length}/500</div>
            </div>

            <div className="form-group">
              <label className="form-label"><Smile size={14} style={{verticalAlign:'middle', marginRight:'4px'}}/> VIBE CHECK</label>
              <div className="mood-selector">
                {['📍', '☕', '🏨', '⛰️', '🏖️', '🍽️', '📸', '✨', '🧘', '🚴', '🏰', '🛶', '🛤️', '🎒', '🌇', '🏮', '🎭'].map((emoji) => (
                  <button key={emoji} type="button" className={`mood-btn ${formData.mood_emoji === emoji ? 'selected' : ''}`}
                    onClick={() => setFormData({ ...formData, mood_emoji: emoji })}>{emoji}</button>
                ))}
              </div>
            </div>
          </div>

          <div className="modal-actions">
            <button type="button" onClick={handleClose} className="btn-secondary">Dismiss</button>
            <button type="submit" className="btn-primary" disabled={isSubmitting}>
              {isSubmitting ? 'Storytelling...' : 'Save Memory ✨'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreatePinModal;
