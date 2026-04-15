import React, { useState, useEffect } from 'react';
import { usersAPI } from '../../utils/api';
import axios from 'axios';
import { MapPin, Navigation, Clock, Calendar, CheckCircle2 } from 'lucide-react';
import './Profile.css';

function Profile({ user, setUser }) {
  const [profile, setProfile] = useState(null);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({ full_name: '', bio: '', home_location: '' });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  const [activities, setActivities] = useState({ hosted: [], attending: [] });
  const [actLoading, setActLoading] = useState(false);

  useEffect(() => { fetchProfile(); }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await usersAPI.getProfile();
      setProfile(res.data.user);
      const loc = res.data.user.home_location || '';
      setFormData({
        full_name: res.data.user.full_name || '',
        bio: res.data.user.bio || '',
        home_location: loc
      });
      setSearchTerm(loc);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const fetchActivities = async () => {
    try {
      setActLoading(true);
      const res = await usersAPI.getMyActivities();
      setActivities(res.data);
    } catch (err) {
      console.error('Error fetching activities:', err);
    } finally {
      setActLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'activities') {
      fetchActivities();
    }
  }, [activeTab]);

  // Photon Autocomplete Search
  useEffect(() => {
    if (searchTerm.length < 3) {
      setSearchResults([]);
      return;
    }
    const delayDebounceFn = setTimeout(async () => {
      try {
        const res = await axios.get(`https://photon.komoot.io/api/?q=${searchTerm}&limit=5`);
        setSearchResults(res.data.features || []);
        setShowResults(true);
      } catch (err) {
        console.error('Search error:', err);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  const handleSelectPlace = (feat) => {
    const name = feat.properties.name || feat.properties.city || feat.properties.state || '';
    const country = feat.properties.country || '';
    const fullName = `${name}${country ? ', ' + country : ''}`;
    
    setFormData(prev => ({ ...prev, home_location: fullName }));
    setSearchTerm(fullName);
    setSearchResults([]);
    setShowResults(false);
  };

  const useCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(async (pos) => {
        try {
          const res = await axios.get(`https://photon.komoot.io/reverse?lon=${pos.coords.longitude}&lat=${pos.coords.latitude}`);
          const feat = res.data.features?.[0];
          if (feat) {
            const city = feat.properties.city || feat.properties.name || 'Current Location';
            setFormData(prev => ({ ...prev, home_location: city }));
            setSearchTerm(city);
          }
        } catch (err) { console.error(err); }
      });
    }
  };

  const handleSave = async () => {
    try {
      const res = await usersAPI.updateProfile(formData);
      setProfile(prev => ({ ...prev, ...res.data.user }));
      setEditing(false);
    } catch (err) { alert('Failed to update profile'); }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  if (loading) return <div className="profile-page" style={{display:'flex',alignItems:'center',justifyContent:'center'}}><div className="spinner"></div></div>;

  const trustScore = profile?.trust_score || 0;

  return (
    <div className="profile-page">
      {/* Hero */}
      <div className="profile-hero">
        <div className="profile-hero-actions">
          <button className="profile-icon-btn">⚙️</button>
          <button className="profile-icon-btn">📤</button>
        </div>
        <div className="profile-avatar-wrapper">
          <div className="profile-avatar">
            {profile?.full_name?.charAt(0) || 'U'}
          </div>
          {profile?.is_verified === 1 && (
            <div className="profile-verified-dot">✓</div>
          )}
        </div>
        <div className="profile-name">{profile?.full_name}</div>
        <div className="profile-location">
          📍 {profile?.home_location || 'Rishikesh, India'} · Joined {new Date(profile?.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </div>
      </div>

      {/* Stats */}
      <div className="profile-stats">
        <div className="profile-stat">
          <div className="stat-value trust">{trustScore}</div>
          <div className="stat-label">Trust Score</div>
        </div>
        <div className="profile-stat">
          <div className="stat-value activities">23</div>
          <div className="stat-label">Activities</div>
        </div>
        <div className="profile-stat">
          <div className="stat-value connections">41</div>
          <div className="stat-label">Connections</div>
        </div>
      </div>

      {/* Badges */}
      <div className="profile-badges">
        {profile?.verification_level === 'verified' && (
          <span className="profile-badge verified">✓ ID Verified</span>
        )}
        <span className="profile-badge host">⭐ Top Host</span>
        <span className="profile-badge explorer">🧭 Explorer</span>
      </div>

      {/* Tabs */}
      <div className="profile-tabs">
        <button 
          className={`profile-tab ${activeTab === 'profile' ? 'active' : ''}`}
          onClick={() => setActiveTab('profile')}
        >
          Profile Info
        </button>
        <button 
          className={`profile-tab ${activeTab === 'activities' ? 'active' : ''}`}
          onClick={() => setActiveTab('activities')}
        >
          My Activities
        </button>
      </div>

      {activeTab === 'profile' ? (
        <>
          {/* Trust breakdown */}
          <div className="trust-breakdown">
            <h3>TRUST SCORE BREAKDOWN</h3>
            <div className="trust-item">
              <span className="trust-item-label">ID Verified</span>
              <div className="trust-item-bar"><div className="trust-item-fill" style={{width:'100%',background:'var(--forest-green)'}} /></div>
              <span className="trust-item-value green">+30</span>
            </div>
            <div className="trust-item">
              <span className="trust-item-label">Activities Hosted</span>
              <div className="trust-item-bar"><div className="trust-item-fill" style={{width:'60%',background:'var(--primary-blue)'}} /></div>
              <span className="trust-item-value blue">+24</span>
            </div>
            <div className="trust-item">
              <span className="trust-item-label">Reviews Received</span>
              <div className="trust-item-bar"><div className="trust-item-fill" style={{width:'60%',background:'var(--sunset-orange)'}} /></div>
              <span className="trust-item-value orange">+24</span>
            </div>
          </div>

          {/* Actions */}
          <div className="profile-actions">
            <button className="btn btn-primary" onClick={() => setEditing(!editing)}>
              {editing ? 'Cancel' : 'Edit Profile'}
            </button>
          </div>

          {/* Edit form */}
          {editing && (
            <div className="edit-profile-section">
              <h3>Edit Profile</h3>
              <div className="form-group">
                <label className="form-label">FULL NAME</label>
                <input type="text" className="form-input" value={formData.full_name}
                  onChange={(e) => setFormData({...formData, full_name: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label">BIO</label>
                <textarea className="form-textarea" value={formData.bio}
                  onChange={(e) => setFormData({...formData, bio: e.target.value})}
                  placeholder="Tell travelers about yourself..." maxLength={500} rows={3} />
              </div>
              <div className="form-group">
                <label className="form-label">HOME LOCATION</label>
                <div style={{position: 'relative'}}>
                  <input type="text" className="form-input" value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onFocus={() => setShowResults(true)}
                    placeholder="Search for your city..." />
                  
                  {showResults && searchResults.length > 0 && (
                    <div className="profile-search-results">
                      {searchResults.map((feat, i) => (
                        <div key={i} className="profile-search-item" onClick={() => handleSelectPlace(feat)}>
                          <MapPin size={16} />
                          <span>{feat.properties.name}, {feat.properties.city || feat.properties.country}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <button type="button" onClick={useCurrentLocation} className="btn-location-inline">
                <Navigation size={14} /> Use Current Location
              </button>
              <button className="btn btn-primary btn-full" style={{marginTop:'20px'}} onClick={handleSave}>Save Changes</button>
            </div>
          )}
        </>
      ) : (
        <div className="profile-activities-list">
          {actLoading ? (
            <div style={{padding: '40px', textAlign: 'center'}}><div className="spinner"></div></div>
          ) : (
            <>
              {activities.hosted.length > 0 && (
                <div className="activity-section">
                  <h4 className="section-title">HOSTING ({activities.hosted.length})</h4>
                  {activities.hosted.map(act => (
                    <div key={act.id} className="profile-activity-card">
                      <div className="act-icon"><Calendar size={20} /></div>
                      <div className="act-details">
                        <div className="act-title">{act.title}</div>
                        <div className="act-info">
                          <Clock size={12} /> {new Date(act.start_time).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                        </div>
                        <div className="act-info">
                          <MapPin size={12} /> {act.location_name}
                        </div>
                      </div>
                      <div className="act-status hosting">HOST</div>
                    </div>
                  ))}
                </div>
              )}

              {activities.attending.length > 0 && (
                <div className="activity-section">
                  <h4 className="section-title">JOINING ({activities.attending.length})</h4>
                  {activities.attending.map(act => (
                    <div key={act.id} className="profile-activity-card">
                      <div className="act-icon attending"><CheckCircle2 size={20} /></div>
                      <div className="act-details">
                        <div className="act-title">{act.title}</div>
                        <div className="act-info">
                          <Clock size={12} /> {new Date(act.start_time).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                        </div>
                        <div className="act-info">
                          Host: <strong>{act.host_name}</strong>
                        </div>
                      </div>
                      <div className="act-status joined">JOINED</div>
                    </div>
                  ))}
                </div>
              )}

              {activities.hosted.length === 0 && activities.attending.length === 0 && (
                <div className="empty-state">
                  <p>You haven't planned any activities yet.</p>
                  <button className="btn btn-primary" onClick={() => window.location.href='/activities'}>Explore Activities</button>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Logout */}
      <div className="logout-section">
        <button className="logout-btn" onClick={handleLogout}>🚪 Sign Out</button>
      </div>
    </div>
  );
}

export default Profile;
