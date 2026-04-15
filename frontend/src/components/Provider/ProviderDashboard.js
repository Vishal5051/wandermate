import React, { useState, useEffect } from 'react';
import { packagesAPI } from '../../utils/api';
import { Package, Calendar, Users, TrendingUp, Plus, ChevronRight, Check, X, Clock, MapPin, Edit, Trash2 } from 'lucide-react';
import './ProviderDashboard.css';

const CATEGORIES = ['Adventure', 'Trekking', 'Wellness', 'Cultural', 'Wildlife', 'Beach', 'Pilgrimage', 'Other'];

function ProviderDashboard({ user }) {
  const [packages, setPackages] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editPkg, setEditPkg] = useState(null);
  const [form, setForm] = useState(getEmptyForm());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('overview');

  function getEmptyForm() {
    return {
      title: '', description: '', destination: '',
      destination_latitude: '', destination_longitude: '',
      duration_days: 3, price: '', max_travelers: 20,
      includes: '', itinerary_text: '',
      available_from: '', available_to: '',
      departure_dates_text: '', category: 'Adventure'
    };
  }

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [pkgRes, bookRes] = await Promise.all([
        packagesAPI.getProviderPackages(),
        packagesAPI.getProviderBookings()
      ]);
      setPackages(pkgRes.data.packages || []);
      setBookings(bookRes.data.bookings || []);
    } catch (err) {
      console.error('Error:', err);
    } finally { setLoading(false); }
  };

  const handleBookingStatus = async (id, status) => {
    try {
      await packagesAPI.updateBookingStatus(id, status);
      fetchData();
    } catch (err) { alert('Failed to update booking'); }
  };

  const pendingBookings = bookings.filter(b => b.status === 'pending');
  const confirmedBookings = bookings.filter(b => b.status === 'confirmed');
  const totalRevenue = confirmedBookings.reduce((sum, b) => sum + Number(b.total_price || 0), 0);

  const stats = [
    { icon: Package, value: packages.length, label: 'Packages', color: '#2563EB' },
    { icon: Clock, value: pendingBookings.length, label: 'Pending', color: '#F59E0B' },
    { icon: Check, value: confirmedBookings.length, label: 'Confirmed', color: '#10B981' },
    { icon: TrendingUp, value: `₹${totalRevenue.toLocaleString()}`, label: 'Revenue', color: '#8B5CF6' },
  ];

  const openCreate = () => {
    setEditPkg(null);
    setForm(getEmptyForm());
    setError('');
    setShowCreateModal(true);
  };

  const openEdit = (pkg) => {
    const parseJSON = (v) => {
      if (!v) return '';
      if (typeof v === 'string') {
        try { const arr = JSON.parse(v); return Array.isArray(arr) ? arr.join('\n') : v; } catch { return v; }
      }
      if (Array.isArray(v)) return v.join('\n');
      return '';
    };
    const parseItinerary = (v) => {
      if (!v) return '';
      let arr = v;
      if (typeof v === 'string') { try { arr = JSON.parse(v); } catch { return v; } }
      if (!Array.isArray(arr)) return '';
      return arr.map(d => `Day ${d.day || ''}: ${d.title || ''} - ${d.desc || ''}`).join('\n');
    };

    setEditPkg(pkg);
    setForm({
      title: pkg.title || '',
      description: pkg.description || '',
      destination: pkg.destination || '',
      destination_latitude: pkg.destination_latitude?.toString() || '',
      destination_longitude: pkg.destination_longitude?.toString() || '',
      duration_days: pkg.duration_days || 3,
      price: pkg.price?.toString() || '',
      max_travelers: pkg.max_travelers || 20,
      includes: parseJSON(pkg.includes),
      itinerary_text: parseItinerary(pkg.itinerary),
      available_from: pkg.available_from ? pkg.available_from.split('T')[0] : '',
      available_to: pkg.available_to ? pkg.available_to.split('T')[0] : '',
      departure_dates_text: parseJSON(pkg.departure_dates),
      category: pkg.category || 'Adventure'
    });
    setError('');
    setShowCreateModal(true);
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    if (!form.title || !form.price || !form.destination || !form.available_from || !form.available_to) {
      setError('Please fill all required fields');
      setSaving(false);
      return;
    }

    try {
      const includesArr = form.includes.split('\n').map(s => s.trim()).filter(Boolean);
      const departureDatesArr = form.departure_dates_text.split('\n').map(s => s.trim()).filter(Boolean);

      // Parse itinerary
      let itineraryArr = null;
      if (form.itinerary_text.trim()) {
        itineraryArr = form.itinerary_text.split('\n').map((line, i) => {
          const match = line.match(/^Day\s*(\d+):\s*(.+?)\s*-\s*(.+)$/i);
          if (match) return { day: parseInt(match[1]), title: match[2].trim(), desc: match[3].trim() };
          return { day: i + 1, title: line.trim(), desc: '' };
        });
      }

      const data = {
        title: form.title,
        description: form.description || undefined,
        destination: form.destination,
        destination_latitude: form.destination_latitude ? parseFloat(form.destination_latitude) : undefined,
        destination_longitude: form.destination_longitude ? parseFloat(form.destination_longitude) : undefined,
        duration_days: parseInt(form.duration_days),
        price: parseFloat(form.price),
        max_travelers: parseInt(form.max_travelers),
        includes: includesArr.length > 0 ? includesArr : undefined,
        itinerary: itineraryArr || undefined,
        available_from: form.available_from,
        available_to: form.available_to,
        departure_dates: departureDatesArr.length > 0 ? departureDatesArr : undefined,
        category: form.category
      };

      if (editPkg) {
        await packagesAPI.update(editPkg.id, data);
      } else {
        await packagesAPI.create(data);
      }

      setShowCreateModal(false);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save');
    } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this package? This cannot be undone.')) {
      try {
        await packagesAPI.delete(id);
        fetchData();
      } catch (err) { alert('Failed to delete'); }
    }
  };

  if (loading) return (
    <div className="provider-dashboard">
      <div className="provider-header">
        <h1>Loading...</h1>
      </div>
    </div>
  );

  return (
    <div className="provider-dashboard">
      <div className="provider-header">
        <div>
          <h1>Welcome, {user?.full_name}</h1>
          <p>Manage your travel packages & bookings</p>
        </div>
        <button className="provider-create-btn" onClick={openCreate}>
          <Plus size={18} /> New Package
        </button>
      </div>

      <div className="provider-body">
        {/* Stats */}
        <div className="provider-stats">
          {stats.map((s, i) => {
            const Icon = s.icon;
            return (
              <div key={i} className="provider-stat-card">
                <div className="provider-stat-icon" style={{ background: `${s.color}15`, color: s.color }}>
                  <Icon size={20} />
                </div>
                <div className="provider-stat-value">{s.value}</div>
                <div className="provider-stat-label">{s.label}</div>
              </div>
            );
          })}
        </div>

        {/* Tabs */}
        <div className="provider-tabs">
          {['overview', 'packages', 'bookings'].map(tab => (
            <button key={tab} className={`provider-tab ${activeTab === tab ? 'active' : ''}`}
              onClick={() => setActiveTab(tab)}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Overview tab */}
        {activeTab === 'overview' && (
          <>
            {/* Pending bookings */}
            <div className="provider-section">
              <div className="section-title">
                <h2>Pending Bookings</h2>
                <span className="section-count">{pendingBookings.length}</span>
              </div>
              {pendingBookings.length === 0 ? (
                <div className="provider-empty-small">No pending bookings</div>
              ) : (
                <div className="provider-booking-list">
                  {pendingBookings.map(b => (
                    <div key={b.id} className="provider-booking-card">
                      <div className="pbc-info">
                        <div className="pbc-title">{b.package_title}</div>
                        <div className="pbc-meta">
                          {b.booker_name} · {b.travelers} traveler{b.travelers > 1 ? 's' : ''} · ₹{Number(b.total_price).toLocaleString()}
                        </div>
                        <div className="pbc-date">
                          <Calendar size={13} /> {new Date(b.travel_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </div>
                      </div>
                      <div className="pbc-actions">
                        <button className="pbc-btn confirm" onClick={() => handleBookingStatus(b.id, 'confirmed')}>
                          <Check size={14} /> Confirm
                        </button>
                        <button className="pbc-btn decline" onClick={() => handleBookingStatus(b.id, 'cancelled')}>
                          <X size={14} /> Decline
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Recent packages */}
            <div className="provider-section">
              <div className="section-title">
                <h2>Your Packages</h2>
                <button className="section-link" onClick={() => setActiveTab('packages')}>View All <ChevronRight size={14} /></button>
              </div>
              <div className="provider-pkg-list">
                {packages.slice(0, 3).map(pkg => (
                  <div key={pkg.id} className="provider-pkg-card">
                    <div className="ppc-category">{pkg.category}</div>
                    <div className="ppc-info">
                      <h3>{pkg.title}</h3>
                      <div className="ppc-meta">
                        <span><MapPin size={13} /> {pkg.destination}</span>
                        <span><Clock size={13} /> {pkg.duration_days}d</span>
                        <span><Users size={13} /> Max {pkg.max_travelers}</span>
                      </div>
                    </div>
                    <div className="ppc-price">₹{Number(pkg.price).toLocaleString()}</div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Packages tab */}
        {activeTab === 'packages' && (
          <div className="provider-section">
            {packages.length === 0 ? (
              <div className="provider-empty">
                <Package size={48} strokeWidth={1} />
                <h3>No packages yet</h3>
                <p>Create your first travel package</p>
                <button className="btn btn-primary" onClick={openCreate}><Plus size={16} /> Create Package</button>
              </div>
            ) : (
              <div className="provider-pkg-grid">
                {packages.map(pkg => (
                  <div key={pkg.id} className="provider-pkg-full-card">
                    <div className="ppfc-header">
                      <div className="ppfc-category">{pkg.category}</div>
                      <div className="ppfc-actions">
                        <button className="ppfc-btn" onClick={() => openEdit(pkg)}><Edit size={14} /></button>
                        <button className="ppfc-btn danger" onClick={() => handleDelete(pkg.id)}><Trash2 size={14} /></button>
                      </div>
                    </div>
                    <h3>{pkg.title}</h3>
                    <div className="ppfc-meta">
                      <span><MapPin size={13} /> {pkg.destination}</span>
                      <span><Clock size={13} /> {pkg.duration_days} days</span>
                    </div>
                    <div className="ppfc-footer">
                      <span className="ppfc-price">₹{Number(pkg.price).toLocaleString()}/person</span>
                      <span className="ppfc-bookings">{pkg.total_bookings || 0} bookings</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Bookings tab */}
        {activeTab === 'bookings' && (
          <div className="provider-section">
            {bookings.length === 0 ? (
              <div className="provider-empty">
                <Calendar size={48} strokeWidth={1} />
                <h3>No bookings yet</h3>
                <p>Bookings from travelers will appear here</p>
              </div>
            ) : (
              <div className="provider-booking-list">
                {bookings.map(b => (
                  <div key={b.id} className={`provider-booking-card status-${b.status}`}>
                    <div className="pbc-info">
                      <div className="pbc-title">{b.package_title}</div>
                      <div className="pbc-meta">
                        {b.booker_name} · {b.travelers} traveler{b.travelers > 1 ? 's' : ''} · ₹{Number(b.total_price).toLocaleString()}
                      </div>
                      <div className="pbc-date">
                        <Calendar size={13} /> {new Date(b.travel_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </div>
                    </div>
                    <div className={`pbc-status ${b.status}`}>{b.status}</div>
                    {b.status === 'pending' && (
                      <div className="pbc-actions">
                        <button className="pbc-btn confirm" onClick={() => handleBookingStatus(b.id, 'confirmed')}>
                          <Check size={14} /> Confirm
                        </button>
                        <button className="pbc-btn decline" onClick={() => handleBookingStatus(b.id, 'cancelled')}>
                          <X size={14} /> Decline
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {showCreateModal && (
        <div className="provider-modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="provider-modal" onClick={(e) => e.stopPropagation()}>
            <div className="provider-modal-header">
              <h2>{editPkg ? 'Edit Package' : 'Create Package'}</h2>
              <button className="provider-modal-close" onClick={() => setShowCreateModal(false)}><X size={18} /></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="provider-modal-body">
                <div className="form-group">
                  <label className="form-label">CATEGORY</label>
                  <div className="category-chips-row">
                    {CATEGORIES.map(cat => (
                      <button key={cat} type="button"
                        className={`cat-chip ${form.category === cat ? 'active' : ''}`}
                        onClick={() => setForm({ ...form, category: cat })}>
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">TITLE *</label>
                  <input type="text" name="title" className="form-input" value={form.title}
                    onChange={handleChange} placeholder="e.g., Rishikesh Adventure Weekend" required />
                </div>

                <div className="form-group">
                  <label className="form-label">DESCRIPTION</label>
                  <textarea name="description" className="form-textarea" value={form.description}
                    onChange={handleChange} placeholder="Describe your package..." rows="3" />
                </div>

                <div className="form-group">
                  <label className="form-label">DESTINATION *</label>
                  <input type="text" name="destination" className="form-input" value={form.destination}
                    onChange={handleChange} placeholder="e.g., Rishikesh, Uttarakhand" required />
                </div>

                <div style={{ display: 'flex', gap: 12 }}>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label className="form-label">PRICE (₹) *</label>
                    <input type="number" name="price" className="form-input" value={form.price}
                      onChange={handleChange} placeholder="4999" min="0" required />
                  </div>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label className="form-label">DURATION (DAYS) *</label>
                    <input type="number" name="duration_days" className="form-input" value={form.duration_days}
                      onChange={handleChange} min="1" max="90" required />
                  </div>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label className="form-label">MAX TRAVELERS</label>
                    <input type="number" name="max_travelers" className="form-input" value={form.max_travelers}
                      onChange={handleChange} min="1" />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 12 }}>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label className="form-label">AVAILABLE FROM *</label>
                    <input type="date" name="available_from" className="form-input" value={form.available_from}
                      onChange={handleChange} required />
                  </div>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label className="form-label">AVAILABLE TO *</label>
                    <input type="date" name="available_to" className="form-input" value={form.available_to}
                      onChange={handleChange} required />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">WHAT'S INCLUDED (one per line)</label>
                  <textarea name="includes" className="form-textarea" value={form.includes}
                    onChange={handleChange} placeholder="White water rafting&#10;All meals&#10;Transport" rows="4" />
                </div>

                <div className="form-group">
                  <label className="form-label">DEPARTURE DATES (one per line, YYYY-MM-DD)</label>
                  <textarea name="departure_dates_text" className="form-textarea" value={form.departure_dates_text}
                    onChange={handleChange} placeholder="2026-05-01&#10;2026-05-15&#10;2026-06-01" rows="3" />
                </div>

                <div className="form-group">
                  <label className="form-label">ITINERARY (one per line: Day N: Title - Description)</label>
                  <textarea name="itinerary_text" className="form-textarea" value={form.itinerary_text}
                    onChange={handleChange} placeholder="Day 1: Arrival - Check-in and welcome ceremony&#10;Day 2: Adventure - Rafting and bungee" rows="4" />
                </div>

                <div style={{ display: 'flex', gap: 12 }}>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label className="form-label">LATITUDE</label>
                    <input type="number" name="destination_latitude" className="form-input" value={form.destination_latitude}
                      onChange={handleChange} step="0.000001" placeholder="30.0869" />
                  </div>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label className="form-label">LONGITUDE</label>
                    <input type="number" name="destination_longitude" className="form-input" value={form.destination_longitude}
                      onChange={handleChange} step="0.000001" placeholder="78.2980" />
                  </div>
                </div>

                {error && <div className="form-error" style={{ marginTop: 12 }}>{error}</div>}
              </div>

              <div className="provider-modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowCreateModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Saving...' : editPkg ? 'Update Package' : 'Create Package'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default ProviderDashboard;
