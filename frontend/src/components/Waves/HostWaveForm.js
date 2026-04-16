import React, { useState } from 'react';
import api from '../../utils/api';
import { MapPin, Navigation, Calendar, Users, DollarSign, ShieldCheck } from 'lucide-react';

function HostWaveForm({ onSuccess, user }) {
  const [formData, setFormData] = useState({
    origin_name: '',
    origin_latitude: 0,
    origin_longitude: 0,
    destination_name: '',
    destination_latitude: 0,
    destination_longitude: 0,
    departure_time: '',
    capacity: 4,
    price_per_seat: '',
    description: '',
    car_model: '',
    car_number: ''
  });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const isIdentityVerified = user?.aadhaar_status === 'verified';
  const isContactVerified = user?.phone_verified === 1 || user?.email_verified === 1;
  const isFullyVerified = isIdentityVerified && isContactVerified;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isFullyVerified) {
      setError('Verification required in Profile & Safety Center to host a wave.');
      return;
    }
    setLoading(true);
    setError(null);

    try {
      let formattedDepTime = formData.departure_time;
      if (formattedDepTime && formattedDepTime.length === 16) {
        formattedDepTime += ':00';
      }

      const dataToSubmit = {
        ...formData,
        departure_time: formattedDepTime,
        capacity: parseInt(formData.capacity) || 1,
        price_per_seat: parseFloat(formData.price_per_seat) || 0,
        origin_latitude: 30.1,
        origin_longitude: 78.3,
        destination_latitude: 28.6,
        destination_longitude: 77.2,
      };
      
      const res = await api.post('/waves', dataToSubmit);
      if (onSuccess) onSuccess(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create wave.');
    } finally {
      setLoading(false);
    }
  };

  const pricePerSeat = parseFloat(formData.price_per_seat) || 0;
  const serviceFee = pricePerSeat * 0.10;
  const passengerPays = pricePerSeat + serviceFee;

  return (
    <div className="modern-form-container">
      <div className="form-header-minimal">
          <ShieldCheck size={20} color="var(--primary)" />
          <h2>Host a New Wave</h2>
      </div>
      
      {!isFullyVerified && (
        <div className="glass p-2 mb-3" style={{ borderLeft: '4px solid var(--danger)', borderRadius: 'var(--radius-md)' }}>
          <p style={{ fontSize: '14px', color: 'var(--text-main)', fontWeight: 600 }}>
            Identity & Contact Verification Required
          </p>
          <p style={{ fontSize: '13px' }}>Please complete your setup in the <a href="/profile" style={{ color: 'var(--primary)', fontWeight: 700 }}>Profile Center</a>.</p>
        </div>
      )}

      {error && <div className="glass p-2 mb-3" style={{ color: 'var(--danger)', fontWeight: 700, fontSize: '14px' }}>{error}</div>}
      
      <form onSubmit={handleSubmit} style={{ opacity: isFullyVerified ? 1 : 0.5 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <div className="form-group">
            <label className="form-label">Leaving from</label>
            <input 
              type="text" name="origin_name" placeholder="E.g., Rishikesh" className="form-input"
              value={formData.origin_name} onChange={handleChange} required disabled={!isFullyVerified} 
            />
          </div>
          <div className="form-group">
            <label className="form-label">Going to</label>
            <input 
              type="text" name="destination_name" placeholder="E.g., New Delhi" className="form-input"
              value={formData.destination_name} onChange={handleChange} required disabled={!isFullyVerified} 
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px' }}>
          <div className="form-group" style={{ gridColumn: 'span 2' }}>
            <label className="form-label">Departure Time</label>
            <input 
              type="datetime-local" name="departure_time" className="form-input"
              value={formData.departure_time} onChange={handleChange} required disabled={!isFullyVerified} 
            />
          </div>
          <div className="form-group">
            <label className="form-label">Seats</label>
            <input 
              type="number" name="capacity" min="1" max="8" className="form-input"
              value={formData.capacity} onChange={handleChange} required disabled={!isFullyVerified} 
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <div className="form-group">
            <label className="form-label">Car Model</label>
            <input 
              type="text" name="car_model" placeholder="E.g., Toyota Innova" className="form-input"
              value={formData.car_model} onChange={handleChange} required disabled={!isFullyVerified} 
            />
          </div>
          <div className="form-group">
            <label className="form-label">Car Number</label>
            <input 
              type="text" name="car_number" placeholder="E.g., UK07 AB 1234" className="form-input"
              value={formData.car_number} onChange={handleChange} required disabled={!isFullyVerified} 
            />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Price per seat (You earn)</label>
          <div className="input-wrapper" style={{ position: 'relative' }}>
             <span style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', fontWeight: 800 }}>$</span>
             <input 
                type="number" name="price_per_seat" placeholder="0.00" min="0" step="0.01" className="form-input"
                style={{ paddingLeft: '32px' }}
                value={formData.price_per_seat} onChange={handleChange} required disabled={!isFullyVerified} 
             />
          </div>
          {pricePerSeat > 0 && (
            <div style={{ marginTop: '8px', fontSize: '13px', color: 'var(--text-muted)' }}>
              Passengers pay <strong>${passengerPays.toFixed(2)}</strong> (including 10% fee)
            </div>
          )}
        </div>

        <div className="form-group">
          <label className="form-label">Additional Notes</label>
          <textarea 
            name="description" placeholder="Any preferences..." rows="2" className="form-textarea"
            value={formData.description} onChange={handleChange} disabled={!isFullyVerified} 
          ></textarea>
        </div>

        <button type="submit" className="btn-modern btn-modern-primary btn-full mt-2" disabled={loading || !isFullyVerified}>
          {loading ? 'Publishing...' : 'Confirm & Publish Wave'}
        </button>
      </form>
    </div>
  );
}

export default HostWaveForm;
