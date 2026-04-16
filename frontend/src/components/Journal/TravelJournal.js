import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Globe, Compass } from 'lucide-react';
import { pinsAPI } from '../../utils/api';
import MemoryLine from './MemoryLine';

function TravelJournal({ user }) {
  const [pins, setPins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [useLocationFilter, setUseLocationFilter] = useState(true);
  const [currentCity, setCurrentCity] = useState(null);

  useEffect(() => {
    if (useLocationFilter) {
      detectLocationAndFetch();
    } else {
      fetchPins();
    }
  }, [useLocationFilter]);

  const detectLocationAndFetch = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const { latitude, longitude } = pos.coords;
          try {
            const res = await fetch(`https://photon.komoot.io/reverse?lon=${longitude}&lat=${latitude}`);
            const data = await res.json();
            const feat = data.features?.[0];
            if (feat) {
              const p = feat.properties;
              const cityName = p.city || p.town || p.district || p.name || 'Nearby';
              setCurrentCity(cityName);
            } else {
              setCurrentCity('Nearby');
            }
          } catch (e) {
            setCurrentCity('Current Area');
          }
          fetchPins(latitude, longitude, 50000); 
        },
        () => {
          setUseLocationFilter(false);
          fetchPins();
        }
      );
    } else {
      setUseLocationFilter(false);
      fetchPins();
    }
  };

  const fetchPins = async (lat, lng, radius) => {
    try {
      setLoading(true);
      const res = await pinsAPI.getAll(lat, lng, radius);
      setPins(res.data.pins || []);
    } catch (err) { 
      console.error(err); 
    } finally { 
      setLoading(false); 
    }
  };

  const handleDelete = async (pinId) => {
    if (window.confirm('Delete this journal entry?')) {
      try { await pinsAPI.delete(pinId); fetchPins(); } catch (err) { alert('Failed to delete'); }
    }
  };

  if (loading) return (
    <div className="journal-page">
      <div className="loading-wave"><div className="spinner-modern"></div></div>
    </div>
  );

  return (
    <div className="journal-page">
      <div className="journal-top-bar">
        <motion.h1 initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>Story Journal</motion.h1>
        <motion.div 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="location-filter-wrapper" 
            onClick={() => setUseLocationFilter(!useLocationFilter)}
        >
          <div className="status-dot-teal"></div>
          <span className="location-filter-label">
            {useLocationFilter ? `Tracing memories in ${currentCity || '...'}` : 'Spanning the globe'}
          </span>
          {useLocationFilter ? <Compass size={16} /> : <Globe size={16} />}
        </motion.div>
      </div>

      <div className="journal-timeline-container">
        <div className="vertical-line"></div>
        {pins.length === 0 ? (
          <div className="provider-empty" style={{ background: 'transparent' }}>
             <h3>Silence in the valley</h3>
             <p>No memories captured here yet. Start your journey on the map.</p>
          </div>
        ) : (
          <MemoryLine pins={pins} onDeletePin={handleDelete} />
        )}
      </div>

    </div>
  );
}

export default TravelJournal;
