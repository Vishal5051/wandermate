import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { marketplaceAPI, bookingAPI } from '../../utils/api';
import './Vendor.css';

const CATEGORY_EMOJIS = {
  Yoga: '🧘', Rafting: '🚣', Stays: '🏨', Camping: '⛺',
  Photography: '📸', Cafe: '☕', Adventure: '🏔️', Other: '🎯'
};

function VendorDashboard({ user }) {
  const [listings, setListings] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [listingsRes, bookingsRes] = await Promise.all([
        marketplaceAPI.getMyListings(),
        bookingAPI.getVendorBookings()
      ]);
      setListings(listingsRes.data.listings || []);
      setBookings(bookingsRes.data.bookings || []);
    } catch (err) {
      console.error('Error fetching vendor data:', err);
    } finally { setLoading(false); }
  };

  const handleBookingStatus = async (bookingId, status) => {
    try {
      await bookingAPI.updateStatus(bookingId, status);
      fetchData();
    } catch (err) {
      alert('Failed to update booking');
    }
  };

  const pendingBookings = bookings.filter(b => b.status === 'pending');

  const stats = [
    { icon: '📦', value: listings.length, label: 'Listings' },
    { icon: '⭐', value: listings.length > 0 ? (listings.reduce((sum, l) => sum + (l.rating || 0), 0) / listings.length).toFixed(1) : '—', label: 'Avg Rating' },
    { icon: '📩', value: pendingBookings.length, label: 'Pending' },
    { icon: '✅', value: bookings.filter(b => b.status === 'confirmed').length, label: 'Confirmed' }
  ];

  const getBgClass = (cat) => (cat || '').toLowerCase().replace(/\s/g, '') || 'default';

  if (loading) return <div className="vendor-dashboard"><div className="vendor-header"><h1>Loading...</h1></div></div>;

  return (
    <div className="vendor-dashboard">
      <div className="vendor-header">
        <h1>Welcome back, {user?.full_name}!</h1>
        <p>Manage your listings and track performance</p>
      </div>

      <div className="vendor-body">
        {/* Stats */}
        <div className="vendor-stats">
          {stats.map((s, i) => (
            <div key={i} className="vendor-stat-card">
              <div className="vendor-stat-icon">{s.icon}</div>
              <div className="vendor-stat-value">{s.value}</div>
              <div className="vendor-stat-label">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Quick actions */}
        <div className="vendor-actions">
          <button className="vendor-action-btn primary" onClick={() => navigate('/vendor/listings/new')}>
            + Add New Listing
          </button>
          <button className="vendor-action-btn secondary" onClick={() => navigate('/vendor/listings')}>
            📦 View All Listings
          </button>
          <button className="vendor-action-btn secondary" onClick={() => navigate('/marketplace')}>
            🛍️ View Marketplace
          </button>
        </div>

        {/* Recent listings */}
        <div className="vendor-section">
          <h2>Recent Bookings</h2>
          {bookings.length === 0 ? (
            <div className="vendor-empty">
              <div className="empty-icon">📩</div>
              <h3>No bookings yet</h3>
              <p>Bookings from travelers will appear here</p>
            </div>
          ) : (
            <div className="vendor-bookings-list">
              {bookings.slice(0, 10).map((b) => (
                <div key={b.id} className={`vendor-booking-card status-${b.status}`}>
                  <div className="vbc-info">
                    <div className="vbc-title">{b.listing_title}</div>
                    <div className="vbc-meta">
                      {b.booker_name} · Qty: {b.quantity} · ₹{b.total_price}
                      {b.booking_date && ` · ${new Date(b.booking_date).toLocaleDateString()}`}
                    </div>
                  </div>
                  <div className="vbc-status">{b.status}</div>
                  {b.status === 'pending' && (
                    <div className="vbc-actions">
                      <button className="vbc-btn confirm" onClick={() => handleBookingStatus(b.id, 'confirmed')}>Confirm</button>
                      <button className="vbc-btn cancel" onClick={() => handleBookingStatus(b.id, 'cancelled')}>Decline</button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Listings */}
        <div className="vendor-section">
          <h2>Your Listings</h2>
          {listings.length === 0 ? (
            <div className="vendor-empty">
              <div className="empty-icon">📦</div>
              <h3>No listings yet</h3>
              <p>Create your first listing to start showcasing your services</p>
              <button className="btn btn-primary" onClick={() => navigate('/vendor/listings/new')}>
                + Create Listing
              </button>
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
                      <div className="vlc-category">{listing.category} · {listing.location_name || 'No location'}</div>
                    </div>
                    <div className="vlc-price">₹{listing.price}</div>
                  </div>
                  <div className="vlc-footer">
                    <div className="vlc-rating">⭐ {listing.rating || '—'}</div>
                    <div className="vlc-actions">
                      <button className="vlc-btn edit" onClick={() => navigate(`/vendor/listings/edit/${listing.id}`)}>Edit</button>
                      <button className="vlc-btn delete" onClick={() => handleDelete(listing.id)}>Delete</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  async function handleDelete(id) {
    if (window.confirm('Delete this listing?')) {
      try {
        await marketplaceAPI.delete(id);
        fetchData();
      } catch (err) { alert('Failed to delete listing'); }
    }
  }
}

export default VendorDashboard;
