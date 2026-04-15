import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI } from '../../utils/api';
import './Auth.css';

function Register({ onLogin }) {
  const [formData, setFormData] = useState({
    email: '', password: '', confirmPassword: '',
    full_name: '', username: '', gender: '', role: 'traveler'
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleGender = (g) => {
    setFormData({ ...formData, gender: g });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      setLoading(false);
      return;
    }

    try {
      const { confirmPassword, ...registerData } = formData;
      const response = await authAPI.register(registerData);
      onLogin(response.data.user, response.data.token);
      const role = response.data.user.role;
      navigate(role === 'vendor' ? '/vendor/dashboard' : role === 'provider' ? '/provider/dashboard' : '/');
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const genders = [
    { value: 'male', label: 'Male' },
    { value: 'female', label: 'Female' },
    { value: 'other', label: 'Non-binary' },
    { value: 'prefer_not_to_say', label: 'Prefer not' }
  ];

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-gradient-header">
          <h1>Tell us about yourself</h1>
          <p>Help others know who you are</p>
        </div>

        <div className="auth-body">
          <form onSubmit={handleSubmit} className="auth-form">
            {/* Role selector */}
            <div className="form-group">
              <label className="form-label">I AM A</label>
              <div className="role-selector">
                <div
                  className={`role-option ${formData.role === 'traveler' ? 'selected' : ''}`}
                  onClick={() => setFormData({ ...formData, role: 'traveler' })}
                >
                  <div className="role-option-icon">🎒</div>
                  <div className="role-option-label">Traveler</div>
                  <div className="role-option-desc">Explore & connect</div>
                </div>
                <div
                  className={`role-option ${formData.role === 'vendor' ? 'selected' : ''}`}
                  onClick={() => setFormData({ ...formData, role: 'vendor' })}
                >
                  <div className="role-option-icon">🏪</div>
                  <div className="role-option-label">Vendor</div>
                  <div className="role-option-desc">Offer services</div>
                </div>
                <div
                  className={`role-option ${formData.role === 'provider' ? 'selected' : ''}`}
                  onClick={() => setFormData({ ...formData, role: 'provider' })}
                >
                  <div className="role-option-icon">✈️</div>
                  <div className="role-option-label">Provider</div>
                  <div className="role-option-desc">Sell travel packages</div>
                </div>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">DISPLAY NAME *</label>
              <input
                type="text"
                name="full_name"
                className="form-input"
                value={formData.full_name}
                onChange={handleChange}
                placeholder="e.g., Sarah"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">USERNAME *</label>
              <input
                type="text"
                name="username"
                className="form-input"
                value={formData.username}
                onChange={handleChange}
                placeholder="Choose a username"
                pattern="[a-zA-Z0-9_]+"
                title="Only letters, numbers, and underscores"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">EMAIL *</label>
              <input
                type="email"
                name="email"
                className="form-input"
                value={formData.email}
                onChange={handleChange}
                placeholder="your@email.com"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">GENDER *</label>
              <div className="gender-chips">
                {genders.map(g => (
                  <button
                    key={g.value}
                    type="button"
                    className={`gender-chip ${formData.gender === g.value ? 'selected' : ''}`}
                    onClick={() => handleGender(g.value)}
                  >
                    {g.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">PASSWORD *</label>
              <input
                type="password"
                name="password"
                className="form-input"
                value={formData.password}
                onChange={handleChange}
                placeholder="Min 6 characters"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">CONFIRM PASSWORD *</label>
              <input
                type="password"
                name="confirmPassword"
                className="form-input"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Confirm your password"
                required
              />
            </div>

            {error && <div className="auth-error">{error}</div>}

            <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
              {loading ? 'Creating Account...' : 'Continue →'}
            </button>
          </form>

          <div className="auth-footer">
            <p>Already have an account? <Link to="/login" className="auth-link">Login</Link></p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Register;
