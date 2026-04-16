import React, { useState, useEffect } from 'react';
import { Car, Search, PlusCircle, User, Clock, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import './WaveDashboard.css';
import api from '../../utils/api';

import WaveSearchForm from './WaveSearchForm';
import HostWaveForm from './HostWaveForm';
import MyWaves from './MyWaves';

function WaveDashboard({ user }) {
  const [activeTab, setActiveTab] = useState('search');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
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

  const containerVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } }
  };

  return (
    <div className="wave-page-wrapper">
      <div className="wave-dashboard-container">
        
        {/* Header Section */}
        <header className="page-header">
          <div className="header-badge btn-modern-primary">
             <Car size={16} />
             <span>WanderWave</span>
          </div>
          <h1>Waves Community</h1>
          <p>Split fares, share stories, and reach your destination together.</p>
        </header>

        {/* Tab Navigation */}
        <nav className="wave-tab-nav">
          {[
            { id: 'search', label: 'Explore Rides', icon: Search },
            { id: 'host', label: 'Host a Wave', icon: PlusCircle },
            { id: 'my-waves', label: 'My Travels', icon: User }
          ].map(tab => (
            <button
              key={tab.id}
              className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <tab.icon size={18} />
              <span>{tab.label}</span>
              {activeTab === tab.id && (
                <motion.div layoutId="wave-active-pill" className="active-pill" />
              )}
            </button>
          ))}
        </nav>

        {/* Dynamic Content Area */}
        <div className="wave-main-content">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
            >
              {activeTab === 'search' && (
                <div className="search-layout">
                  <header className="search-header-pod">
                    <WaveSearchForm onSearch={fetchWaves} />
                  </header>
                  
                  <main className="results-grid">
                    <div className="results-header">
                       <h2>Live Waves</h2>
                       <span>{searchResults.length} nearby rides found</span>
                    </div>

                    {loading && (
                      <div className="loading-state">
                        <div className="spinner-modern"></div>
                        <p>Scanning the horizon...</p>
                      </div>
                    )}

                    {error && <div className="error-card">⚠️ {error}</div>}
                    
                    {!loading && !error && searchResults.length === 0 && (
                      <div className="empty-state">
                        <Car size={64} />
                        <p>No waves in this area yet.<br/>Be the first to host one!</p>
                      </div>
                    )}
                    
                    {!loading && (
                      <div className="cards-stack">
                        {searchResults.map((wave, idx) => (
                          <WaveCard 
                            key={wave.id} 
                            wave={wave} 
                            onJoin={handleJoinRequest} 
                            currentUser={user} 
                            delay={idx * 0.05}
                          />
                        ))}
                      </div>
                    )}
                  </main>
                </div>
              )}

              {activeTab === 'host' && (
                <div className="form-center-layout">
                   <div className="glass-card-modern" style={{ maxWidth: '800px', margin: '0 auto' }}>
                      <HostWaveForm user={user} onSuccess={() => {
                        alert('Wave created successfully!');
                        setActiveTab('my-waves');
                      }} />
                   </div>
                </div>
              )}

              {activeTab === 'my-waves' && (
                <MyWaves user={user} />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

function WaveCard({ wave, onJoin, currentUser, delay }) {
  const [seatsRequested, setSeatsRequested] = useState(1);
  const isHost = currentUser && currentUser.id === wave.host_id;
  
  const seatsAvailable = wave.capacity - wave.current_travelers;
  const price = parseFloat(wave.price_per_seat);
  const totalWithFee = price + (price * 0.1); 

  return (
    <motion.div 
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay, duration: 0.4 }}
      className="wave-entry-card glass-card"
    >
      <div className="entry-main">
        <div className="entry-route">
          <div className="route-stop">
            <span className="dot start" />
            <span>{wave.origin_name}</span>
          </div>
          <div className="route-line" />
          <div className="route-stop">
             <span className="dot end" />
             <span>{wave.destination_name}</span>
          </div>
        </div>

        <div className="entry-meta">
           <div className="meta-info">
             <Clock size={16} />
             <span>{new Date(wave.departure_time).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</span>
           </div>
           <div className="meta-info">
             <Car size={16} />
             <span>{wave.car_model || 'Standard Trip'}</span>
           </div>
           {wave.current_travelers > 0 && (
             <div className="meta-info traveller-count">
               <User size={14} />
               <span>{wave.current_travelers} Joined</span>
             </div>
           )}
        </div>

        <div className="entry-host">
           <div className="host-v-avatar">
              {wave.host_name?.charAt(0) || 'U'}
           </div>
           <div className="host-v-details">
              <span className="name">{wave.host_name}</span>
              <span className="trust"><ShieldCheck size={12} /> {wave.trust_score || 95}% Verified</span>
           </div>
        </div>
      </div>

      <div className="entry-action">
        <div className="price-tag">
           <span className="amount">₹{Math.round(totalWithFee)}</span>
           <span className="label">EST. FARE</span>
        </div>

        <div className="seats-indicator">
          {seatsAvailable} seats open
        </div>

        {!isHost && seatsAvailable > 0 && (
          <div className="entry-request-box">
             <div className="seats-picker">
                <button onClick={() => setSeatsRequested(Math.max(1, seatsRequested - 1))}>-</button>
                <span>{seatsRequested}</span>
                <button onClick={() => setSeatsRequested(Math.min(seatsAvailable, seatsRequested + 1))}>+</button>
             </div>
             <button className="btn-modern btn-modern-primary btn-full" onClick={() => onJoin(wave.id, seatsRequested)}>
                Book Now →
             </button>
          </div>
        )}

        {isHost && (
          <div className="host-own-tag">
             <span>You are hosting this</span>
          </div>
        )}
      </div>
    </motion.div>
  );
}

export default WaveDashboard;
