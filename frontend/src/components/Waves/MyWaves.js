import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api, { wavesAPI } from '../../utils/api';
import { 
  Navigation, 
  MessageSquare, ChevronDown, ChevronUp, UserCheck, 
  History, Calendar, ArrowRight, Star, ShieldCheck,
  Trash2, UserX, X
} from 'lucide-react';

import ReviewModal from '../Safety/ReviewModal';
import GroupChat from '../Chat/GroupChat';
import './MyWaves.css';

function MyWaves({ user }) {
  const [data, setData] = useState({ hosted: [], requested: [] });
  const [loading, setLoading] = useState(true);
  const [timeline, setTimeline] = useState('upcoming'); 
  const [showReview, setShowReview] = useState(null);
  const [openChatId, setOpenChatId] = useState(null);
  const [cancellingMember, setCancellingMember] = useState(null);

  useEffect(() => {
    fetchMyWaves();
  }, []);

  const fetchMyWaves = async () => {
    try {
      setLoading(true);
      const res = await api.get('/waves/my-waves');
      setData(res.data);
    } catch (error) {
      console.error('Error fetching my waves', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelWave = async (waveId) => {
    if (!window.confirm('Are you absolutely sure you want to cancel this entire ride? All passengers will be notified.')) return;
    try {
      await wavesAPI.deleteWave(waveId);
      fetchMyWaves();
    } catch (err) { alert('Failed to delete wave'); }
  };

  const handleConfirmCancelMember = async (reason) => {
    try {
      await wavesAPI.cancelMember(cancellingMember.id, reason);
      setCancellingMember(null);
      fetchMyWaves();
    } catch (err) { alert('Failed to cancel member'); }
  };

  const isPast = (dateStr) => new Date(dateStr) < new Date();

  // Filter logic for Upcoming vs Past
  const activeHosted = data.hosted.filter(w => timeline === 'upcoming' ? !isPast(w.departure_time) : isPast(w.departure_time));
  const activeRequested = data.requested.filter(r => timeline === 'upcoming' ? !isPast(r.departure_time) : isPast(r.departure_time));

  if (loading) return (
    <div className="loading-state">
      <div className="spinner-modern"></div>
      <p>Synchronizing your journeys...</p>
    </div>
  );

  return (
    <div className="my-waves-modern">
      {/* Timeline Toggle */}
      <div className="travel-timeline-nav">
        <button 
          className={`timeline-tab ${timeline === 'upcoming' ? 'active' : ''}`}
          onClick={() => setTimeline('upcoming')}
        >
          <Calendar size={16} style={{marginRight: '8px', display: 'inline'}} />
          Upcoming
        </button>
        <button 
          className={`timeline-tab ${timeline === 'past' ? 'active' : ''}`}
          onClick={() => setTimeline('past')}
        >
          <History size={16} style={{marginRight: '8px', display: 'inline'}} />
          Past Travels
        </button>
      </div>

      <div className="travel-content-area">
        <section className="wave-section">
          <div className="ep-section-title">
             <UserCheck size={16} /> Hosting
          </div>
          
          {activeHosted.length === 0 ? (
            <div className="empty-state-mini glass" style={{ padding: '40px', textAlign: 'center' }}>
               <p>No {timeline === 'upcoming' ? 'active' : 'past'} hostings found.</p>
            </div>
          ) : (
            <div className="boarding-pass-stack">
              {activeHosted.map(wave => (
                <HostedWaveCard 
                  key={wave.id} 
                  wave={wave} 
                  onUpdate={fetchMyWaves} 
                  chatOpen={openChatId === `host_${wave.id}`}
                  setChatOpen={(val) => setOpenChatId(val ? `host_${wave.id}` : null)}
                  user={user}
                  isPast={timeline === 'past'}
                  onDelete={() => handleCancelWave(wave.id)}
                  onCancelMember={(req) => setCancellingMember(req)}
                />
              ))}
            </div>
          )}
        </section>

        <section className="wave-section mt-5">
          <div className="ep-section-title">
             <Navigation size={16} /> Joined
          </div>
          
          {activeRequested.length === 0 ? (
            <div className="empty-state-mini glass" style={{ padding: '40px', textAlign: 'center' }}>
               <p>No {timeline === 'upcoming' ? 'active' : 'past'} requests found.</p>
            </div>
          ) : (
            <div className="boarding-pass-stack">
              {activeRequested.map(req => (
                <RequestedWaveCard 
                  key={req.id}
                  req={req}
                  user={user}
                  chatOpen={openChatId === `req_${req.id}`}
                  setChatOpen={(val) => setOpenChatId(val ? `req_${req.id}` : null)}
                  onReviewHost={() => setShowReview(req)}
                  isPast={timeline === 'past'}
                />
              ))}
            </div>
          )}
        </section>
      </div>

      <AnimatePresence>
        {showReview && (
          <ReviewModal 
            entityId={showReview.host_id} 
            entityType="user" 
            entityName={showReview.host_name} 
            onClose={() => setShowReview(null)} 
          />
        )}
        {cancellingMember && (
          <CancelMemberModal 
            member={cancellingMember} 
            onClose={() => setCancellingMember(null)} 
            onConfirm={handleConfirmCancelMember} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function CancelMemberModal({ member, onClose, onConfirm }) {
  const [reason, setReason] = useState('');

  return (
    <div className="edit-profile-overlay" style={{zIndex: 6000}}>
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="edit-profile-modal"
        style={{maxWidth: '450px'}}
        onClick={e => e.stopPropagation()}
      >
        <div className="ep-header">
           <div className="ep-header-text">
              <h2>Remove Traveler</h2>
              <p>Removing {member.full_name} from your ride</p>
           </div>
           <button className="close-ep-btn" onClick={onClose}><X size={20}/></button>
        </div>
        <div className="ep-body">
           <div className="ep-input-group">
              <label className="ep-label">Cancellation Reason</label>
              <textarea 
                className="ep-input ep-textarea" 
                placeholder="Why are you removing this traveler? This will be shared with them."
                value={reason}
                onChange={e => setReason(e.target.value)}
              />
           </div>
        </div>
        <div className="ep-footer">
           <button className="btn-modern btn-modern-secondary" onClick={onClose}>Cancel</button>
           <button 
             className="btn-modern btn-modern-danger" 
             disabled={!reason.trim()}
             onClick={() => onConfirm(reason)}
           >
             Confirm Removal
           </button>
        </div>
      </motion.div>
    </div>
  );
}

function HostedWaveCard({ wave, onUpdate, chatOpen, setChatOpen, user, isPast, onDelete, onCancelMember }) {
  const [requests, setRequests] = useState([]);
  const [showRequests, setShowRequests] = useState(false);
  const [reqLoading, setReqLoading] = useState(false);

  const toggleRequests = async () => {
    if (!showRequests) {
      setReqLoading(true);
      try {
        const res = await wavesAPI.getRequests(wave.id);
        setRequests(res.data);
      } catch (error) { console.error(error); }
      setReqLoading(false);
    }
    setShowRequests(!showRequests);
  };

  const handleAction = async (reqId, status) => {
    try {
      await wavesAPI.processRequest(reqId, status);
      onUpdate();
      toggleRequests(); 
    } catch (error) { alert('Failed to update'); }
  };

  return (
    <motion.div layout className="travel-card-v3">
      <div className="tc-header">
        <div className="tc-route">
          <div className="tc-stop">
            <h4>From</h4>
            <p>{wave.origin_name}</p>
          </div>
          <div className="tc-arrow">
            <ArrowRight size={20} />
          </div>
          <div className="tc-stop">
            <h4>To</h4>
            <p>{wave.destination_name}</p>
          </div>
        </div>
        <div className="tc-status" data-status={isPast ? 'completed' : (wave.pending_requests > 0 ? 'pending' : 'approved')}>
          {isPast ? 'Journey Ended' : (wave.pending_requests > 0 ? 'Action Needed' : 'Scheduled')}
        </div>
      </div>

      <div className="tc-body">
        <div className="tc-meta-grid">
          <div className="tc-meta-item">
            <span>Date & Time</span>
            <span>{new Date(wave.departure_time).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</span>
          </div>
          <div className="tc-meta-item">
            <span>Travelers</span>
            <span>{wave.current_travelers} Joined</span>
          </div>
          <div className="tc-meta-item">
            <span>Type</span>
            <span>Host Entry</span>
          </div>
        </div>

        <div className="tc-actions">
          {!isPast && (
            <button className="btn-modern btn-modern-danger" onClick={onDelete} title="Cancel Entire Ride">
              <Trash2 size={16} /> Cancel Ride
            </button>
          )}
          <button 
            className={`btn-modern ${chatOpen ? 'btn-modern-primary' : 'btn-modern-secondary'}`}
            onClick={() => setChatOpen(!chatOpen)}
          >
            <MessageSquare size={16} /> Chat
          </button>
          {!isPast && (
            <button className="btn-modern btn-modern-primary" onClick={toggleRequests}>
              {showRequests ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              Manage ({requests.length})
            </button>
          )}
        </div>
      </div>

      <AnimatePresence>
        {chatOpen && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="tc-expansion">
             <GroupChat type="wave" id={wave.id} user={user} />
          </motion.div>
        )}

        {showRequests && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="tc-expansion">
             <h4 className="tc-section-title">Manage Passengers & Requests</h4>
             {reqLoading ? <div className="spinner-modern mini"></div> : (
               <div className="req-list">
                  {requests.length === 0 && <p className="text-muted small">No requests yet.</p>}
                  {requests.map(req => (
                    <div key={req.id} className="req-item glass" style={{ display: 'flex', justifyContent: 'space-between', padding: '16px', borderRadius: '12px', marginBottom: '8px' }}>
                       <div className="req-user">
                          <span style={{ fontWeight: 800, color: 'var(--text-main)', display: 'block' }}>{req.full_name}</span>
                          <span style={{ fontSize: '12px', color: 'var(--teal)', fontWeight: 700 }}><ShieldCheck size={12} style={{display:'inline'}}/> {req.trust_score}% Trust</span>
                       </div>
                       <div className="req-status-info" style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
                          <span style={{ fontSize: '13px', fontWeight: 600 }}>{req.seats_requested} seats</span>
                          
                          {req.status === 'pending' ? (
                            <div className="req-btns" style={{ display: 'flex', gap: '8px' }}>
                               <button className="btn-modern btn-modern-primary btn-mini" style={{ padding: '6px 12px', fontSize: '11px' }} onClick={() => handleAction(req.id, 'approved')}>Accept</button>
                               <button className="btn-modern btn-modern-secondary btn-mini" style={{ padding: '6px 12px', fontSize: '11px' }} onClick={() => handleAction(req.id, 'rejected')}>Deny</button>
                            </div>
                          ) : req.status === 'approved' ? (
                            <div className="req-btns" style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                               <span className="tc-status" data-status="approved" style={{ padding: '4px 10px' }}>Member</span>
                               {!isPast && (
                                 <button 
                                   className="btn-icon danger-glow" 
                                   onClick={() => onCancelMember(req)}
                                   title="Remove Member"
                                 >
                                   <UserX size={18} />
                                 </button>
                               )}
                            </div>
                          ) : (
                            <span className="tc-status" data-status={req.status} style={{ padding: '4px 10px' }}>{req.status}</span>
                          )}
                       </div>
                    </div>
                  ))}
               </div>
             )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function RequestedWaveCard({ req, user, chatOpen, setChatOpen, onReviewHost, isPast }) {
  return (
    <motion.div layout className="travel-card-v3">
       <div className="tc-header">
          <div className="tc-route">
            <div className="tc-stop">
              <h4>From</h4>
              <p>{req.origin_name}</p>
            </div>
            <div className="tc-arrow">
              <ArrowRight size={20} />
            </div>
            <div className="tc-stop">
              <h4>To</h4>
              <p>{req.destination_name}</p>
            </div>
          </div>
          <div className="tc-status" data-status={isPast ? 'completed' : req.status}>
             {isPast ? 'Trip Memories' : req.status.toUpperCase()}
          </div>
       </div>

       <div className="tc-body">
          <div className="tc-meta-grid">
            <div className="tc-meta-item">
              <span>Departure</span>
              <span>{new Date(req.departure_time).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</span>
            </div>
            <div className="tc-meta-item">
              <span>Host</span>
              <span style={{ color: 'var(--teal)' }}>{req.host_name}</span>
            </div>
            <div className="tc-meta-item">
              <span>Status</span>
              <span>{req.status === 'approved' ? 'Seat Reserved' : (req.status === 'pending' ? 'Waiting' : 'Ended')}</span>
            </div>
          </div>

          <div className="tc-actions">
            {req.status === 'approved' && (
              <button 
                className={`btn-modern ${chatOpen ? 'btn-modern-primary' : 'btn-modern-secondary'}`}
                onClick={() => setChatOpen(!chatOpen)}
              >
                <MessageSquare size={16} /> {chatOpen ? 'Hide Chat' : 'Member Chat'}
              </button>
            )}

            {isPast && req.status === 'approved' && (
              <button className="btn-modern btn-modern-primary" onClick={onReviewHost}>
                <Star size={16} /> Review Host
              </button>
            )}
          </div>
       </div>

       <AnimatePresence>
          {chatOpen && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="tc-expansion">
               <GroupChat type="wave" id={req.wave_id} user={user} />
            </motion.div>
          )}
       </AnimatePresence>
    </motion.div>
  );
}

export default MyWaves;
