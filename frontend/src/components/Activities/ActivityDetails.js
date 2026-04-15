import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { activitiesAPI } from '../../utils/api';
import './Activities.css';

const typeColors = {
  'Hike': '#059669', 'Cafe': '#92400E', 'Night Out': '#7C3AED', 'Yoga': '#10B981',
  'Food Tour': '#F59E0B', 'Arts': '#EC4899', 'Photography': '#6366F1',
  'Weekend Trip': '#F97316', 'Sports': '#3B82F6', 'Spiritual': '#8B5CF6',
  'Community': '#14B8A6', 'Other': '#6B7280'
};
const typeEmoji = {
  'Hike': '⛰️', 'Cafe': '☕', 'Night Out': '✨', 'Yoga': '🧘', 'Food Tour': '🍜',
  'Arts': '🎨', 'Photography': '📸', 'Weekend Trip': '🎒', 'Sports': '🏀',
  'Spiritual': '🛕', 'Community': '🤝', 'Other': '📍'
};

function ActivityDetails({ user }) {
  const { id } = useParams();
  const [activity, setActivity] = useState(null);
  const [attendees, setAttendees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => { fetchActivity(); }, [id]);

  const fetchActivity = async () => {
    try {
      setLoading(true);
      const res = await activitiesAPI.getById(id);
      setActivity(res.data.activity);
      setAttendees(res.data.attendees);
    } catch (err) {
      setError('Failed to load activity');
    } finally {
      setLoading(false);
    }
  };

  const handleRSVP = async () => {
    try {
      setActionLoading(true);
      await activitiesAPI.rsvp(id);
      await fetchActivity();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to RSVP');
    } finally { setActionLoading(false); }
  };

  const handleCancelRSVP = async () => {
    try {
      setActionLoading(true);
      await activitiesAPI.cancelRSVP(id);
      await fetchActivity();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to cancel RSVP');
    } finally { setActionLoading(false); }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this activity?')) {
      try {
        await activitiesAPI.delete(id);
        navigate('/');
      } catch (err) {
        alert(err.response?.data?.error || 'Failed to delete');
      }
    }
  };

  if (loading) return <div className="activity-details-container"><div className="spinner" style={{margin:'40px auto'}}></div></div>;
  if (error || !activity) return (
    <div className="activity-details-container" style={{padding:24,textAlign:'center'}}>
      <p className="error-message">{error || 'Activity not found'}</p>
      <button onClick={() => navigate('/')} className="btn btn-primary">Back to Map</button>
    </div>
  );

  const isHost = activity.host_id === user.id;
  const hasRSVPed = activity.is_rsvped > 0;
  const isFull = activity.current_attendees >= activity.capacity;
  const startTime = new Date(activity.start_time);
  const isPast = startTime < new Date();
  const bg = typeColors[activity.activity_type] || '#6B7280';
  const spotsLeft = activity.capacity - activity.current_attendees;

  return (
    <div className="activity-details-container">
      {/* Hero */}
      <div className="activity-detail-hero" style={{ background: bg }}>
        <button className="activity-detail-back" onClick={() => navigate('/')}>←</button>
        <span>{typeEmoji[activity.activity_type] || '📍'}</span>
        <div className="activity-detail-type-badge">
          {typeEmoji[activity.activity_type]} {activity.activity_type}
        </div>
      </div>

      <div className="activity-detail-body">
        {/* Host */}
        <div className="activity-detail-host">
          <div className="detail-host-avatar">{activity.host_name?.charAt(0)}</div>
          <div className="detail-host-info">
            <div className="detail-host-name">
              {activity.host_name}
              {activity.host_verification === 'verified' && <span className="badge badge-verified">✓ Verified</span>}
            </div>
            <div className="detail-host-meta">
              <span className="badge badge-trust">⭐ {activity.host_trust_score} Trust</span>
              <a href="#profile" className="detail-view-profile">View Profile →</a>
            </div>
          </div>
        </div>

        {/* Title & meta */}
        <h1 className="activity-detail-title">{activity.title}</h1>
        <div className="detail-meta-list">
          <div className="detail-meta-item"><span className="icon">🕐</span> {startTime.toLocaleDateString()} at {startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
          <div className="detail-meta-item"><span className="icon">📍</span> {activity.location_name}</div>
        </div>

        {/* Attendees */}
        <div className="detail-attendees">
          <h3>ATTENDEES ({activity.current_attendees} / {activity.capacity})</h3>
          <div className="attendee-circles">
            {attendees.slice(0, 4).map(a => (
              <div key={a.id} className="attendee-circle">{a.full_name?.charAt(0)}</div>
            ))}
            {spotsLeft > 0 && <span className="attendee-more">+{spotsLeft} spots open</span>}
          </div>
        </div>

        {/* Description */}
        {activity.description && (
          <div className="detail-description">
            <h3>DESCRIPTION</h3>
            <p>{activity.description}</p>
          </div>
        )}
      </div>

      {/* Bottom action */}
      <div className="detail-bottom-action">
        {isHost ? (
          <button onClick={handleDelete} className="detail-join-btn" style={{ background: 'var(--alert-red)' }}>
            Delete Activity
          </button>
        ) : isPast ? (
          <div className="past-message">This activity has ended</div>
        ) : hasRSVPed ? (
          <button onClick={handleCancelRSVP} className="detail-join-btn" style={{ background: 'var(--alert-red)' }} disabled={actionLoading}>
            {actionLoading ? 'Processing...' : 'Cancel RSVP'}
          </button>
        ) : isFull ? (
          <div className="full-message">This activity is full</div>
        ) : (
          <>
            <button onClick={handleRSVP} className="detail-join-btn" disabled={actionLoading}>
              {actionLoading ? 'Processing...' : '🎉 Join Activity'}
            </button>
            <p className="detail-safety-note">⚠️ Meet in public places · Report if uncomfortable</p>
          </>
        )}
      </div>
    </div>
  );
}

export default ActivityDetails;
