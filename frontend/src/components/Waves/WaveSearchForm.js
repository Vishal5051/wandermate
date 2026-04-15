import React, { useState } from 'react';
import { MapPin, Navigation, Calendar } from 'lucide-react';

function WaveSearchForm({ onSearch }) {
  const [searchParams, setSearchParams] = useState({
    origin: '',
    destination: '',
    date: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSearch(searchParams);
  };

  return (
    <div className="wave-form-card" style={{ padding: '16px' }}>
      <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '12px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
        <div className="form-group flex-1" style={{ marginBottom: 0 }}>
          <label><MapPin size={14} style={{ display: 'inline' }}/> Leaving from</label>
          <input 
            type="text" 
            placeholder="Origin" 
            value={searchParams.origin}
            onChange={(e) => setSearchParams({...searchParams, origin: e.target.value})}
          />
        </div>
        <div className="form-group flex-1" style={{ marginBottom: 0 }}>
          <label><Navigation size={14} style={{ display: 'inline' }}/> Going to</label>
          <input 
            type="text" 
            placeholder="Destination" 
            value={searchParams.destination}
            onChange={(e) => setSearchParams({...searchParams, destination: e.target.value})}
          />
        </div>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label><Calendar size={14} style={{ display: 'inline' }}/> Date</label>
          <input 
            type="date" 
            value={searchParams.date}
            onChange={(e) => setSearchParams({...searchParams, date: e.target.value})}
          />
        </div>
        <button type="submit" className="submit-btn" style={{ width: 'auto', marginTop: 0, padding: '10px 24px' }}>
          Search
        </button>
      </form>
    </div>
  );
}

export default WaveSearchForm;
