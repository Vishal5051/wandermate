import React, { useState, useEffect } from 'react';
import { pinsAPI } from '../../utils/api';
import MemoryLine from './MemoryLine';
import './TravelJournal.css';

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
          
          // Reverse geocode to get city name for display
          try {
            const res = await fetch(`https://photon.komoot.io/reverse?lon=${longitude}&lat=${latitude}`);
            const data = await res.json();
            const feat = data.features?.[0];
            if (feat) {
              const p = feat.properties;
              // Use city or town or district
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

  if (loading) return <div className="journal-page" style={{display:'flex',alignItems:'center',justifyContent:'center',minHeight:'60vh'}}><div className="spinner"></div></div>;

  return (
    <div className="journal-page immersion-theme" style={{ backgroundColor: '#f0f4f8' }}>
      {/* Top bar */}
      <div className="journal-top-bar" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', background: 'transparent', borderBottom: 'none', paddingTop: '32px', gap: '8px' }}>
        <h1 style={{ fontSize: '32px', textAlign: 'center', textTransform: 'uppercase', letterSpacing: '2px', color: '#1e293b', margin: 0 }}>
          Memory Line
        </h1>
        <div className="location-filter-toggle" style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(255,255,255,0.8)', padding: '6px 14px', borderRadius: '20px', fontSize: '13px', fontWeight: '600', color: '#64748b', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }} onClick={() => setUseLocationFilter(!useLocationFilter)}>
          <span style={{ color: useLocationFilter ? '#3b82f6' : '#94a3b8' }}>{useLocationFilter ? `📍 Memories in ${currentCity || '...'}` : '🌍 All Memories'}</span>
        </div>
      </div>

      <div className="journal-dashboard-grid" style={{ gridTemplateColumns: '1fr', maxWidth: '800px', margin: '0 auto', paddingBottom: '100px' }}>
        
        {/* Memory Line Section */}
        <div className="journal-timeline-section" style={{ marginTop: '20px' }}>
          <div className="timeline-wrapper">
            <MemoryLine pins={pins} onDeletePin={handleDelete} />
          </div>
        </div>
      </div>

    </div>
  );
}

export default TravelJournal;
