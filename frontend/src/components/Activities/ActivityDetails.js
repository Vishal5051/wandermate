import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { activitiesAPI } from '../../utils/api';
import ReviewModal from '../Safety/ReviewModal';
import ReportModal from '../Safety/ReportModal';
import GroupChat from '../Chat/GroupChat';
import { Phone, Mail, MessageSquare, MapPin, Clock, ShieldCheck } from 'lucide-react';
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
  const [showReview, setShowReview] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState('details');
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
  const isConfirmed = hasRSVPed;
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

      <div className="activity-detail-content">
        <div className="activity-detail-main">
          <div className="activity-detail-tabs">
            <button 
              className={`tab-btn ${activeSubTab === 'details' ? 'active' : ''}`}
              onClick={() => setActiveSubTab('details')}
            >
              Details
            </button>
            {(isConfirmed || isHost) && (
              <button 
                className={`tab-btn ${activeSubTab === 'chat' ? 'active' : ''}`}
                onClick={() => setActiveSubTab('chat')}
              >
                <MessageSquare size={16} style={{marginRight: 6}} /> Group Chat
              </button>
            )}
          </div>

          {activeSubTab === 'details' ? (
            <>
              <div className="activity-header">
                <h1>{activity.title}</h1>
                <div className="activity-meta">
                  <span className="location"><MapPin size={16} /> {activity.location_name}</span>
                  <span className="time"><Clock size={16} /> {startTime.toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</span>
                </div>
              </div>

              <div className="activity-description">
                <p>{activity.description || 'No description provided.'}</p>
              </div>

              {(isConfirmed || isHost) && (activity.host_phone || activity.host_email) && (
                <div className="host-contact-section" style={{
                  marginTop: 24, padding: 16, background: '#f0fdf4', border: '1px solid #dcfce7', borderRadius: 12
                }}>
                  <h3 style={{fontSize: 14, color: '#166534', marginBottom: 12, display:'flex', alignItems:'center', gap: 6}}>
                    <ShieldCheck size={16} /> Host Contact Details
                  </h3>
                  <div style={{display:'flex', flexWrap:'wrap', gap: 20}}>
                    {activity.host_phone && <div style={{display:'flex', alignItems:'center', gap: 8, fontSize: 13, color: '#14532d'}}>
                      <Phone size={14} /> {activity.host_phone}
                    </div>}
                    {activity.host_email && <div style={{display:'flex', alignItems:'center', gap: 8, fontSize: 13, color: '#14532d'}}>
                      <Mail size={14} /> {activity.host_email}
                    </div>}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="activity-chat-wrapper" style={{marginTop: 20}}>
              <GroupChat type="activity" id={id} user={user} />
            </div>
          )}
        </div>

        <div className="activity-detail-host">
          <div className="detail-host-avatar">{activity.host_name?.charAt(0)}</div>
          <div className="detail-host-info">
            <div className="detail-host-name">
              {activity.host_name}
              {activity.host_verification === 'verified' && <span className="badge badge-verified">✓ Verified</span>}
            </div>
            <div className="detail-host-meta">
              <span className="badge badge-trust">⭐ {activity.host_trust_score} Trust</span>
              <button 
                onClick={() => setShowReport(true)} 
                style={{ background:'none', border:'none', color:'#ef4444', fontSize:'11px', cursor:'pointer', padding:0, textDecoration:'underline', marginLeft:'8px' }}
              >
                Report Potential Fraud
              </button>
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
          <div className="past-container" style={{ width:'100%' }}>
            <div className="past-message" style={{ marginBottom:'12px' }}>This activity has ended</div>
            {hasRSVPed && (
              <button onClick={() => setShowReview(true)} className="btn-modern btn-modern-primary" style={{ width:'100%' }}>
                Post a Review for {activity.host_name}
              </button>
            )}
          </div>
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
          </>
        )}
      </div>

      {/* Modals */}
      {showReview && (
        <ReviewModal 
          entityId={activity.host_id} 
          entityType="user" 
          entityName={activity.host_name} 
          onClose={() => setShowReview(false)} 
        />
      )}
      {showReport && (
        <ReportModal 
          entityId={activity.id} 
          entityType="activity" 
          entityName={activity.title} 
          onClose={() => setShowReport(false)} 
        />
      )}
    </div>
  );
}

export default ActivityDetails;
