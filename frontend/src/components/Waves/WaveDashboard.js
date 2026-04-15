import React, { useState, useEffect } from 'react';
import { Car, Search, PlusCircle, User, Clock, Navigation } from 'lucide-react';
import './WaveDashboard.css';
import api from '../../utils/api';

import WaveSearchForm from './WaveSearchForm';
import HostWaveForm from './HostWaveForm';
import MyWaves from './MyWaves';

function WaveDashboard({ user }) {
  const [activeTab, setActiveTab] = useState('search'); // 'search', 'host', 'my-waves'
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Load some waves initially
    fetchWaves({});
  }, []);

  const fetchWaves = async (params) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/waves', { params });
      setSearchResults(res.data);
    } catch (err) {
      setError('Failed to load waves');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinRequest = async (waveId, seatsRequested) => {
    try {
      await api.post(`/waves/${waveId}/join`, { seats_requested: seatsRequested });
      alert('Request sent to host!');
      setActiveTab('my-waves');
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to request join');
    }
  };

  return (
    <div className="wave-container">
      <div className="wave-header">
        <h1><Car size={28} /> Wave - Shared Cabs</h1>
      </div>

      <div className="wave-modes">
        <div 
          className={`mode-tab ${activeTab === 'search' ? 'active' : ''}`}
          onClick={() => setActiveTab('search')}
        >
          <Search size={18} style={{ display: 'inline', marginRight: '6px' }}/> Find a Ride
        </div>
        <div 
          className={`mode-tab ${activeTab === 'host' ? 'active' : ''}`}
          onClick={() => setActiveTab('host')}
        >
          <PlusCircle size={18} style={{ display: 'inline', marginRight: '6px' }}/> Host a Ride
        </div>
        <div 
          className={`mode-tab ${activeTab === 'my-waves' ? 'active' : ''}`}
          onClick={() => setActiveTab('my-waves')}
        >
          <User size={18} style={{ display: 'inline', marginRight: '6px' }}/> My Waves
        </div>
      </div>

      <div className="wave-content">
        {activeTab === 'search' && (
          <>
            <WaveSearchForm onSearch={fetchWaves} />
            
            <div className="wave-results" style={{ marginTop: '24px' }}>
              <h3 style={{ marginBottom: '16px' }}>Available Rides</h3>
              {loading && <div>Loading...</div>}
              {error && <div style={{ color: 'red' }}>{error}</div>}
              {!loading && !error && searchResults.length === 0 && (
                <p style={{ color: '#6b7280' }}>No rides found for your search criteria.</p>
              )}
              
              {!loading && searchResults.map(wave => (
                <WaveCard key={wave.id} wave={wave} onJoin={handleJoinRequest} currentUser={user} />
              ))}
            </div>
          </>
        )}

        {activeTab === 'host' && (
          <HostWaveForm onSuccess={() => {
            alert('Wave created successfully!');
            setActiveTab('my-waves');
          }} />
        )}

        {activeTab === 'my-waves' && (
          <MyWaves user={user} />
        )}
      </div>
    </div>
  );
}

function WaveCard({ wave, onJoin, currentUser }) {
  const [seatsRequested, setSeatsRequested] = useState(1);
  const isHost = currentUser && currentUser.id === wave.host_id;
  
  const seatsAvailable = wave.capacity - wave.current_travelers;
  const price = parseFloat(wave.price_per_seat);
  const totalWithFee = price + (price * 0.1); 

  return (
    <div className="wave-card">
      <div className="wave-card-main">
        <div className="wave-route">
          {wave.origin_name} <Navigation size={18} /> {wave.destination_name}
        </div>
        <div className="wave-time">
          <Clock size={16} /> {new Date(wave.departure_time).toLocaleString()}
        </div>
        
        <div className="wave-host">
          <div className="host-avatar">
            {wave.host_name.charAt(0)}
          </div>
          <div className="host-info">
            <span className="host-name">{wave.host_name}</span>
            <span className="trust-badge">Trust Score: {wave.trust_score}%</span>
          </div>
        </div>

        {wave.description && (
          <p style={{ marginTop: '12px', fontSize: '14px', color: '#4b5563' }}>
            {wave.description}
          </p>
        )}
      </div>

      <div className="wave-card-side">
        <div style={{ textAlign: 'right' }}>
          <div className="wave-price">${totalWithFee.toFixed(2)}</div>
          <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px' }}>
            per passenger (incl. fee)
          </div>
        </div>
        
        <div className="seats-left">
          {seatsAvailable} seat{seatsAvailable !== 1 ? 's' : ''} left
        </div>

        {!isHost && seatsAvailable > 0 && (
          <div style={{ display: 'flex', gap: '8px' }}>
            <input 
              type="number" 
              min="1" 
              max={seatsAvailable} 
              value={seatsRequested}
              onChange={(e) => setSeatsRequested(parseInt(e.target.value))}
              style={{ width: '60px', padding: '6px', borderRadius: '6px', border: '1px solid #d1d5db' }}
            />
            <button 
              className="join-btn" 
              onClick={() => onJoin(wave.id, seatsRequested)}
            >
              Request
            </button>
          </div>
        )}
        
        {isHost && (
          <div style={{ color: '#3b82f6', fontWeight: 'bold' }}>Your Wave</div>
        )}
      </div>
    </div>
  );
}

export default WaveDashboard;
