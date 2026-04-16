import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { packagesAPI } from '../../utils/api';
import { Package, Users, TrendingUp, Plus, Check, X, Clock, MapPin, Edit, Trash2 } from 'lucide-react';
import './ProviderDashboard.css';

// eslint-disable-next-line

function ProviderDashboard({ user }) {
  const [packages, setPackages] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editPkg, setEditPkg] = useState(null);
  const [form, setForm] = useState(getEmptyForm());
  const [saving, setSaving] = useState(false);
  // eslint-disable-next-line
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
    { icon: Package, value: packages.length, label: 'Packages', color: 'var(--teal)' },
    { icon: Clock, value: pendingBookings.length, label: 'Requests', color: 'var(--coral)' },
    { icon: Check, value: confirmedBookings.length, label: 'Confirmed', color: 'var(--teal)' },
    { icon: TrendingUp, value: `₹${totalRevenue.toLocaleString()}`, label: 'Revenue', color: 'var(--teal)' },
  ];

  const openCreate = () => {
    setEditPkg(null);
    setForm(getEmptyForm());
    setError('');
    setShowCreateModal(true);
  };

  const openEdit = (pkg) => {
    // eslint-disable-next-line
    const parseJSON = (v) => {
      if (!v) return '';
      if (typeof v === 'string') {
        try { const arr = JSON.parse(v); return Array.isArray(arr) ? arr.join('\n') : v; } catch { return v; }
      }
      if (Array.isArray(v)) return v.join('\n');
      return '';
    };

    setEditPkg(pkg);
    setForm({
      title: pkg.title || '',
      description: pkg.description || '',
      destination: pkg.destination || '',
      price: pkg.price?.toString() || '',
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

    try {
      if (editPkg) {
        await packagesAPI.update(editPkg.id, form);
      } else {
        await packagesAPI.create(form);
      }
      setShowCreateModal(false);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save');
    } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this package?')) {
      try {
        await packagesAPI.delete(id);
        fetchData();
      } catch (err) { alert('Failed to delete'); }
    }
  };

  if (loading) return (
    <div className="provider-dashboard">
      <div className="loading-wave"><div className="spinner-modern"></div></div>
    </div>
  );

  return (
    <div className="provider-dashboard">
      <div className="provider-header">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <h1>Package Hub</h1>
          <p>Hi {user?.full_name}, here is your curation overview.</p>
        </motion.div>
        <button className="provider-create-btn" onClick={openCreate}>
          <Plus size={20} /> New Concept
        </button>
      </div>

      <div className="provider-body">
        {/* Stats */}
        <div className="provider-stats">
          {stats.map((s, i) => {
            const Icon = s.icon;
            return (
              <motion.div 
                key={i} 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="provider-stat-card"
              >
                <div className="provider-stat-icon" style={{ color: s.color }}>
                  <Icon size={24} />
                </div>
                <div className="provider-stat-value">{s.value}</div>
                <div className="provider-stat-label">{s.label}</div>
              </motion.div>
            );
          })}
        </div>

        {/* Tabs */}
        <div className="provider-tabs">
          {[
            { id: 'overview', label: 'Dashboard' },
            { id: 'packages', label: 'My Concepts' },
            { id: 'bookings', label: 'Traveler List' }
          ].map(tab => (
            <button key={tab.id} className={`provider-tab ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}>
              {tab.label}
              {activeTab === tab.id && <motion.div layoutId="provider-pill" className="active-pill" />}
            </button>
          ))}
        </div>

        {/* Overview tab */}
        {activeTab === 'overview' && (
          <AnimatePresence mode="wait">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="tab-content">
              {/* Pending bookings */}
              <div className="provider-section">
                <div className="section-title">
                  <h2>New Requests</h2>
                  <span className="section-count">{pendingBookings.length}</span>
                </div>
                {pendingBookings.length === 0 ? (
                  <div className="provider-empty-small">All caught up! No pending requests.</div>
                ) : (
                  <div className="provider-booking-list">
                    {pendingBookings.map(b => (
                      <motion.div key={b.id} whileHover={{ x: 8 }} className="provider-booking-card">
                        <div className="pbc-info">
                          <div className="pbc-title">{b.package_title}</div>
                          <div className="pbc-meta">
                            <Users size={12} className="inline mr-1" /> {b.booker_name} · {b.travelers} Persons · <span className="text-teal font-bold">₹{Number(b.total_price).toLocaleString()}</span>
                          </div>
                          <div className="pbc-date">
                            <Clock size={13} /> Requested for {new Date(b.travel_date).toLocaleDateString()}
                          </div>
                        </div>
                        <div className="pbc-actions">
                          <button className="pbc-btn confirm" onClick={() => handleBookingStatus(b.id, 'confirmed')}>
                            <Check size={14} /> Accept
                          </button>
                          <button className="pbc-btn decline" onClick={() => handleBookingStatus(b.id, 'cancelled')}>
                            <X size={14} /> Decline
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </AnimatePresence>
        )}

        {/* Packages tab */}
        {activeTab === 'packages' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="provider-section">
            {packages.length === 0 ? (
              <div className="provider-empty">
                <Package size={48} strokeWidth={1} />
                <h3>No Packages Found</h3>
                <button className="btn-modern btn-modern-primary" onClick={openCreate}><Plus size={16} /> Create Now</button>
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
                    </div>
                    <div className="ppfc-footer">
                      <span className="ppfc-price">₹{Number(pkg.price).toLocaleString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </div>

      {/* Create/Edit Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="provider-modal-overlay" onClick={() => setShowCreateModal(false)}>
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="provider-modal" onClick={(e) => e.stopPropagation()}>
              <div className="provider-modal-header">
                <h2>{editPkg ? 'Refine Concept' : 'New Concept'}</h2>
                <button className="provider-modal-close" onClick={() => setShowCreateModal(false)}><X size={18} /></button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="provider-modal-body">
                  <div className="form-group mb-4">
                    <label className="form-label block mb-2">TITLE *</label>
                    <input type="text" name="title" className="form-input" value={form.title}
                      onChange={handleChange} required />
                  </div>
                   <div className="form-group mb-4">
                    <label className="form-label block mb-2">PRICE *</label>
                    <input type="number" name="price" className="form-input" value={form.price}
                      onChange={handleChange} required />
                  </div>
                </div>
                <div className="provider-modal-actions">
                  <button type="button" className="btn-modern btn-modern-secondary" onClick={() => setShowCreateModal(false)}>Discard</button>
                  <button type="submit" className="btn-modern btn-modern-primary" disabled={saving}>
                    {saving ? 'Transmitting...' : 'Launch'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default ProviderDashboard;
