import React, { useState, useEffect } from 'react';
import { usersAPI } from '../../utils/api';
import './Profile.css';

function Profile({ user, setUser }) {
  const [profile, setProfile] = useState(null);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({ full_name: '', bio: '', home_location: '' });
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchProfile(); }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await usersAPI.getProfile();
      setProfile(res.data.user);
      setFormData({
        full_name: res.data.user.full_name || '',
        bio: res.data.user.bio || '',
        home_location: res.data.user.home_location || ''
      });
    } catch (err) { console.error(err); } finally { setLoading(false); }
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
        <button className="btn btn-secondary">My Activities</button>
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
            <input type="text" className="form-input" value={formData.home_location}
              onChange={(e) => setFormData({...formData, home_location: e.target.value})}
              placeholder="e.g., Rishikesh, India" />
          </div>
          <button className="btn btn-primary btn-full" onClick={handleSave}>Save Changes</button>
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
