import React, { useState } from 'react';
import api from '../../utils/api';
import { MapPin, Navigation, Calendar, Users, DollarSign } from 'lucide-react';

function HostWaveForm({ onSuccess }) {
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
    description: ''
  });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const depTime = new Date(formData.departure_time);
    if (isNaN(depTime.getTime())) {
      setError('Please select a valid departure date and time');
      setLoading(false);
      return;
    }

    try {
      // Format departure time to ISO 8601 with seconds if needed
      let formattedDepTime = formData.departure_time;
      if (formattedDepTime && formattedDepTime.length === 16) {
        formattedDepTime += ':00';
      }

      // Mock coordinates for MVP (In real app, use Places API)
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
      
      console.log('Submitting Wave:', dataToSubmit);
      const res = await api.post('/waves', dataToSubmit);
      if (onSuccess) onSuccess(res.data);
    } catch (err) {
      console.error('Wave Creation Error:', err.response?.data);
      const errorMessage = err.response?.data?.error || 
                          (err.response?.data?.errors && err.response.data.errors[0]?.msg) || 
                          'Failed to create wave. Please check all fields.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const pricePerSeat = parseFloat(formData.price_per_seat) || 0;
  const serviceFee = pricePerSeat * 0.10; // 10% fee
  const passengerPays = pricePerSeat + serviceFee;

  return (
    <div className="wave-form-card">
      <h2 style={{ marginBottom: '20px' }}>Host a Shared Cab</h2>
      {error && <div className="error-message" style={{ color: 'red', marginBottom: '16px' }}>{error}</div>}
      
      <form onSubmit={handleSubmit}>
        <div className="wave-form-row">
          <div className="form-group flex-1">
            <label><MapPin size={16} style={{ display: 'inline', marginRight: '4px' }}/> Leaving from</label>
            <input 
              type="text" 
              name="origin_name" 
              placeholder="E.g., Rishikesh" 
              value={formData.origin_name}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group flex-1">
            <label><Navigation size={16} style={{ display: 'inline', marginRight: '4px' }}/> Going to</label>
            <input 
              type="text" 
              name="destination_name" 
              placeholder="E.g., New Delhi" 
              value={formData.destination_name}
              onChange={handleChange}
              required
            />
          </div>
        </div>

        <div className="wave-form-row">
          <div className="form-group flex-1">
            <label><Calendar size={16} style={{ display: 'inline', marginRight: '4px' }}/> Departure Time</label>
            <input 
              type="datetime-local" 
              name="departure_time" 
              value={formData.departure_time}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group flex-1" style={{ maxWidth: '150px' }}>
            <label><Users size={16} style={{ display: 'inline', marginRight: '4px' }}/> Seats</label>
            <input 
              type="number" 
              name="capacity" 
              min="1" 
              max="8"
              value={formData.capacity}
              onChange={handleChange}
              required
            />
          </div>
        </div>

        <div className="wave-form-row">
          <div className="form-group flex-1">
            <label><DollarSign size={16} style={{ display: 'inline', marginRight: '4px' }}/> Price per seat (You earn)</label>
            <input 
              type="number" 
              name="price_per_seat" 
              placeholder="0.00" 
              min="0"
              step="0.01"
              value={formData.price_per_seat}
              onChange={handleChange}
              required
            />
            {pricePerSeat > 0 && (
              <div className="fee-notice">
                Passengers will pay <strong>${passengerPays.toFixed(2)}</strong> (${pricePerSeat.toFixed(2)} + 10% Wave service fee)
              </div>
            )}
          </div>
        </div>

        <div className="form-group">
          <label>Additional Notes</label>
          <textarea 
            name="description" 
            placeholder="Luggage space, breaks, pet policy..." 
            rows="3"
            value={formData.description}
            onChange={handleChange}
          ></textarea>
        </div>

        <button type="submit" className="submit-btn" disabled={loading}>
          {loading ? 'Creating...' : 'Publish Wave'}
        </button>
      </form>
    </div>
  );
}

export default HostWaveForm;
