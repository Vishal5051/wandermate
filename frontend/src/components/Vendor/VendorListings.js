import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { marketplaceAPI } from '../../utils/api';
import './Vendor.css';

const CATEGORIES = ['Yoga', 'Rafting', 'Stays', 'Camping', 'Cafe', 'Photography', 'Adventure', 'Other'];
const CATEGORY_EMOJIS = {
  Yoga: '🧘', Rafting: '🚣', Stays: '🏨', Camping: '⛺',
  Photography: '📸', Cafe: '☕', Adventure: '🏔️', Other: '🎯'
};

function VendorListings({ user }) {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editListing, setEditListing] = useState(null);
  const [form, setForm] = useState(getEmptyForm());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  function getEmptyForm() {
    return {
      title: '', description: '', category: 'Yoga', price: '',
      latitude: '', longitude: '', location_name: '',
      vendor_name: user?.full_name || '', duration: '',
      contact_phone: '', contact_email: user?.email || ''
    };
  }

  useEffect(() => { fetchListings(); }, []);

  const fetchListings = async () => {
    try {
      setLoading(true);
      const res = await marketplaceAPI.getMyListings();
      setListings(res.data.listings || []);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const openCreate = () => {
    setEditListing(null);
    setForm(getEmptyForm());
    setError('');
    setShowModal(true);
  };

  const openEdit = (listing) => {
    setEditListing(listing);
    setForm({
      title: listing.title || '',
      description: listing.description || '',
      category: listing.category || 'Yoga',
      price: listing.price?.toString() || '',
      latitude: listing.latitude?.toString() || '',
      longitude: listing.longitude?.toString() || '',
      location_name: listing.location_name || '',
      vendor_name: listing.vendor_name || user?.full_name || '',
      duration: listing.duration || '',
      contact_phone: listing.contact_phone || '',
      contact_email: listing.contact_email || ''
    });
    setError('');
    setShowModal(true);
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError('');
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setForm(prev => ({
          ...prev,
          latitude: pos.coords.latitude.toFixed(6),
          longitude: pos.coords.longitude.toFixed(6)
        })),
        () => {}
      );
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    if (!form.title || !form.price || !form.location_name || !form.vendor_name) {
      setError('Please fill all required fields');
      setSaving(false);
      return;
    }

    try {
      const data = {
        ...form,
        price: parseFloat(form.price),
        latitude: form.latitude ? parseFloat(form.latitude) : 30.0869,
        longitude: form.longitude ? parseFloat(form.longitude) : 78.2980
      };

      if (editListing) {
        await marketplaceAPI.update(editListing.id, data);
      } else {
        await marketplaceAPI.create(data);
      }

      setShowModal(false);
      fetchListings();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save listing');
    } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this listing? This cannot be undone.')) {
      try {
        await marketplaceAPI.delete(id);
        fetchListings();
      } catch (err) { alert('Failed to delete listing'); }
    }
  };

  const getBgClass = (cat) => (cat || '').toLowerCase().replace(/\s/g, '') || 'default';

  return (
    <div className="vendor-dashboard">
      <div className="vendor-header">
        <h1>My Listings</h1>
        <p>{listings.length} service{listings.length !== 1 ? 's' : ''} listed</p>
      </div>

      <div className="vendor-body">
        <div className="vendor-actions">
          <button className="vendor-action-btn primary" onClick={openCreate}>
            + Add New Listing
          </button>
          <button className="vendor-action-btn secondary" onClick={() => navigate('/vendor/dashboard')}>
            ← Back to Dashboard
          </button>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 60 }}><div className="spinner" style={{ margin: '0 auto' }}></div></div>
        ) : listings.length === 0 ? (
          <div className="vendor-empty">
            <div className="empty-icon">📦</div>
            <h3>No listings yet</h3>
            <p>Start by creating your first service listing</p>
            <button className="btn btn-primary" onClick={openCreate}>+ Create Listing</button>
          </div>
        ) : (
          <div className="vendor-listings-grid">
            {listings.map((listing) => (
              <div key={listing.id} className="vendor-listing-card">
                <div className="vlc-header">
                  <div className={`vlc-icon ${getBgClass(listing.category)}`}>
                    {CATEGORY_EMOJIS[listing.category] || '🎯'}
                  </div>
                  <div className="vlc-info">
                    <div className="vlc-title">{listing.title}</div>
                    <div className="vlc-category">{listing.category} · {listing.duration || '—'}</div>
                  </div>
                  <div className="vlc-price">₹{listing.price}</div>
                </div>
                <div className="vlc-footer">
                  <div className="vlc-rating">⭐ {listing.rating || '—'} · 📍 {listing.location_name || '—'}</div>
                  <div className="vlc-actions">
                    <button className="vlc-btn edit" onClick={() => openEdit(listing)}>Edit</button>
                    <button className="vlc-btn delete" onClick={() => handleDelete(listing.id)}>Delete</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="vendor-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="vendor-modal" onClick={(e) => e.stopPropagation()}>
            <div className="vendor-modal-header">
              <h2>{editListing ? 'Edit Listing' : 'Create New Listing'}</h2>
              <button className="vendor-modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="vendor-modal-body">
                <div className="form-group">
                  <label className="form-label">CATEGORY *</label>
                  <div className="gender-chips">
                    {CATEGORIES.map(cat => (
                      <button key={cat} type="button"
                        className={`gender-chip ${form.category === cat ? 'selected' : ''}`}
                        onClick={() => setForm({ ...form, category: cat })}>
                        {CATEGORY_EMOJIS[cat]} {cat}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">TITLE *</label>
                  <input type="text" name="title" className="form-input" value={form.title}
                    onChange={handleChange} placeholder="e.g., River Rafting 16km" required />
                </div>

                <div className="form-group">
                  <label className="form-label">DESCRIPTION</label>
                  <textarea name="description" className="form-textarea" value={form.description}
                    onChange={handleChange} placeholder="Describe your service..." rows="3" />
                </div>

                <div className="form-row" style={{ display: 'flex', gap: 12 }}>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label className="form-label">PRICE (₹) *</label>
                    <input type="number" name="price" className="form-input" value={form.price}
                      onChange={handleChange} placeholder="600" min="0" step="1" required />
                  </div>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label className="form-label">DURATION</label>
                    <input type="text" name="duration" className="form-input" value={form.duration}
                      onChange={handleChange} placeholder="e.g., 3 hours" />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">BUSINESS / VENDOR NAME *</label>
                  <input type="text" name="vendor_name" className="form-input" value={form.vendor_name}
                    onChange={handleChange} placeholder="Your business name" required />
                </div>

                <div className="form-group">
                  <label className="form-label">LOCATION NAME *</label>
                  <input type="text" name="location_name" className="form-input" value={form.location_name}
                    onChange={handleChange} placeholder="e.g., Shivpuri, Rishikesh" required />
                </div>

                <div className="form-row" style={{ display: 'flex', gap: 12 }}>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label className="form-label">LATITUDE</label>
                    <input type="number" name="latitude" className="form-input" value={form.latitude}
                      onChange={handleChange} step="0.000001" placeholder="30.0869" />
                  </div>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label className="form-label">LONGITUDE</label>
                    <input type="number" name="longitude" className="form-input" value={form.longitude}
                      onChange={handleChange} step="0.000001" placeholder="78.2980" />
                  </div>
                </div>

                <button type="button" onClick={getCurrentLocation} className="btn btn-secondary btn-full mb-2">
                  📍 Use Current Location
                </button>

                <div className="form-row" style={{ display: 'flex', gap: 12 }}>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label className="form-label">CONTACT PHONE</label>
                    <input type="tel" name="contact_phone" className="form-input" value={form.contact_phone}
                      onChange={handleChange} placeholder="+91 98765 43210" />
                  </div>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label className="form-label">CONTACT EMAIL</label>
                    <input type="email" name="contact_email" className="form-input" value={form.contact_email}
                      onChange={handleChange} placeholder="you@business.com" />
                  </div>
                </div>

                {error && <div className="form-error" style={{ marginTop: 12 }}>{error}</div>}
              </div>

              <div className="vendor-modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Saving...' : editListing ? 'Update Listing' : 'Create Listing'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default VendorListings;
