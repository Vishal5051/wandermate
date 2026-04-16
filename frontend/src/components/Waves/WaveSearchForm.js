import React, { useState } from 'react';
import { MapPin, Navigation, Calendar, Search, ArrowLeftRight } from 'lucide-react';
import './WaveSearchForm.css';

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

  const swapLocations = () => {
    setSearchParams(prev => ({
      ...prev,
      origin: prev.destination,
      destination: prev.origin
    }));
  };

  return (
    <div className="wave-search-bar">
      <form onSubmit={handleSubmit} className="ws-form">
        <div className="ws-input-wrapper">
          <MapPin size={18} className="ws-icon" />
          <input 
            type="text" 
            className="ws-input"
            placeholder="From where?" 
            value={searchParams.origin}
            onChange={(e) => setSearchParams({...searchParams, origin: e.target.value})}
          />
        </div>

        <button type="button" className="ws-swap-btn" onClick={swapLocations} title="Swap Locations">
          <ArrowLeftRight size={18} />
        </button>

        <div className="ws-input-wrapper">
          <Navigation size={18} className="ws-icon" />
          <input 
            type="text" 
            className="ws-input"
            placeholder="Going to?" 
            value={searchParams.destination}
            onChange={(e) => setSearchParams({...searchParams, destination: e.target.value})}
          />
        </div>

        <div className="ws-input-wrapper" style={{ maxWidth: '180px' }}>
          <Calendar size={18} className="ws-icon" />
          <input 
            type="date" 
            className="ws-input ws-input-date"
            value={searchParams.date}
            onChange={(e) => setSearchParams({...searchParams, date: e.target.value})}
          />
        </div>

        <button type="submit" className="ws-submit-btn">
          <Search size={18} />
          <span>Search</span>
        </button>
      </form>
    </div>
  );
}

export default WaveSearchForm;
