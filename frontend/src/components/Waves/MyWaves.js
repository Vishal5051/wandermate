import React, { useEffect, useState } from 'react';
import api from '../../utils/api';
import { Clock, Navigation, MapPin } from 'lucide-react';

function MyWaves({ user }) {
  const [data, setData] = useState({ hosted: [], requested: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMyWaves();
  }, []);

  const fetchMyWaves = async () => {
    try {
      const res = await api.get('/waves/my-waves');
      setData(res.data);
    } catch (error) {
      console.error('Error fetching my waves', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="wave-results">
      <h3>Waves You're Hosting</h3>
      {data.hosted.length === 0 ? (
        <p style={{ color: '#6b7280' }}>You haven't hosted any waves yet.</p>
      ) : (
        data.hosted.map(wave => (
          <HostedWaveCard key={wave.id} wave={wave} onUpdate={fetchMyWaves} />
        ))
      )}

      <h3 style={{ marginTop: '24px' }}>Your Travel Requests</h3>
      {data.requested.length === 0 ? (
        <p style={{ color: '#6b7280' }}>You haven't requested to join any waves.</p>
      ) : (
        data.requested.map(req => (
          <div key={req.id} className="wave-card">
            <div className="wave-card-main">
              <div className="wave-route">
                {req.origin_name} <Navigation size={16} /> {req.destination_name}
              </div>
              <div className="wave-time">
                <Clock size={14} /> {new Date(req.departure_time).toLocaleString()}
              </div>
              <div className="wave-host">
                Host: <strong>{req.host_name}</strong>
              </div>
              <div style={{ marginTop: '8px' }}>
                Status: <strong style={{ 
                  color: req.status === 'approved' ? 'green' : req.status === 'rejected' ? 'red' : 'orange'
                }}>{req.status.toUpperCase()}</strong>
              </div>
            </div>
            <div className="wave-card-side">
              <div className="seats-left">{req.seats_requested} Seat(s)</div>
              <div className="wave-price">${parseFloat(req.total_price).toFixed(2)}</div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

function HostedWaveCard({ wave, onUpdate }) {
  const [requests, setRequests] = useState([]);
  const [showRequests, setShowRequests] = useState(false);

  const fetchRequests = async () => {
    try {
      const res = await api.get(`/waves/${wave.id}/requests`);
      setRequests(res.data);
      setShowRequests(true);
    } catch (error) {
      console.error('Error fetching requests', error);
    }
  };

  const handleAction = async (reqId, status) => {
    try {
      await api.put(`/waves/requests/${reqId}`, { status });
      onUpdate();
      fetchRequests();
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to update request');
    }
  };

  return (
    <div className="wave-card" style={{ flexDirection: 'column' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
        <div>
          <div className="wave-route">
            {wave.origin_name} <Navigation size={16} /> {wave.destination_name}
          </div>
          <div className="wave-time">
            <Clock size={14} /> {new Date(wave.departure_time).toLocaleString()}
          </div>
          <div>Seats left: {wave.capacity - wave.current_travelers} / {wave.capacity}</div>
        </div>
        <div>
          <button className="host-btn" onClick={fetchRequests}>
            View Requests ({wave.pending_requests})
          </button>
        </div>
      </div>

      {showRequests && (
        <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '16px' }}>
          <h4>Passenger Requests</h4>
          {requests.length === 0 && <p>No requests yet.</p>}
          {requests.map(req => (
            <div key={req.id} className="request-card">
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div>
                  <strong>{req.full_name}</strong> (Trust: {req.trust_score})<br/>
                  Requested {req.seats_requested} seat(s) for ${parseFloat(req.total_price).toFixed(2)}
                </div>
                <div>Status: {req.status}</div>
              </div>
              {req.status === 'pending' && (
                <div className="request-actions">
                  <button className="approve-btn" onClick={() => handleAction(req.id, 'approved')}>Accept</button>
                  <button className="reject-btn" onClick={() => handleAction(req.id, 'rejected')}>Reject</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default MyWaves;
