import React, { useState, useEffect } from 'react';
import { marketplaceAPI, bookingAPI } from '../../utils/api';
import { Search, Star, MapPin, Clock, X, Check, ShoppingBag } from 'lucide-react';
import './Marketplace.css';

const CATEGORIES = ['All', 'Yoga', 'Rafting', 'Stays', 'Camping', 'Cafe', 'Photography', 'Adventure'];

const CATEGORY_EMOJIS = {
  Yoga: '🧘', Rafting: '🚣', Stays: '🏡', Camping: '⛺',
  Cafe: '☕', Photography: '📸', Adventure: '🏔️'
};

const CATEGORY_BG = {
  Yoga: 'bg-yoga', Rafting: 'bg-rafting', Stays: 'bg-stays', Camping: 'bg-camping',
  Cafe: 'bg-cafe', Photography: 'bg-photo', Adventure: 'bg-adventure'
};

function Marketplace({ user, userLocation }) {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedListing, setSelectedListing] = useState(null);
  const [bookingState, setBookingState] = useState({ loading: false, success: false, error: null });
  const [bookingForm, setBookingForm] = useState({ quantity: 1, booking_date: '', notes: '' });

  useEffect(() => { fetchListings(); }, [activeCategory, userLocation]);

  const fetchListings = async () => {
    try {
      setLoading(true);
      const params = {};
      if (activeCategory !== 'All') params.category = activeCategory;
      if (userLocation) {
        params.lat = userLocation.lat;
        params.lng = userLocation.lng;
        params.radius = 5000;
      }
      const res = await marketplaceAPI.getListings(params);
      setListings(res.data.listings || []);
    } catch (err) {
      console.error('Error fetching listings:', err);
      setListings([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredListings = listings.filter(l =>
    !searchQuery || l.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (l.vendor_name && l.vendor_name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const featured = filteredListings.length > 0 ? filteredListings[0] : null;
  const popular = filteredListings.length > 1 ? filteredListings.slice(1) : [];

  const getEmoji = (cat) => CATEGORY_EMOJIS[cat] || '🎯';
  const getBgClass = (cat) => CATEGORY_BG[cat] || 'default';

  const openListing = (listing) => {
    setSelectedListing(listing);
    setBookingState({ loading: false, success: false, error: null });
    setBookingForm({ quantity: 1, booking_date: '', notes: '' });
  };

  const handleBookNow = async (listing) => {
    setBookingState({ loading: true, success: false, error: null });
    try {
      await bookingAPI.create({
        listing_id: listing.id,
        quantity: bookingForm.quantity,
        booking_date: bookingForm.booking_date || undefined,
        notes: bookingForm.notes || undefined
      });
      setBookingState({ loading: false, success: true, error: null });
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to create booking';
      setBookingState({ loading: false, success: false, error: msg });
    }
  };

  if (loading) return <div className="marketplace-page"><div className="spinner"></div></div>;

  return (
    <div className="marketplace-page">
      {/* Top bar */}
      <div className="marketplace-top-bar">
        <h1>Marketplace</h1>
        <p>Discover local experiences & services</p>
        <div className="marketplace-search">
          <Search className="search-icon" size={18} />
          <input
            type="text"
            placeholder="Search activities, stays, cafes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Category chips */}
      <div className="marketplace-categories">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            className={`category-chip ${activeCategory === cat ? 'active' : ''}`}
            onClick={() => setActiveCategory(cat)}
          >
            {cat !== 'All' && getEmoji(cat) + ' '}{cat}
          </button>
        ))}
      </div>

      {filteredListings.length === 0 ? (
        <div className="marketplace-empty">
          <div className="empty-icon">🏪</div>
          <h3>No listings found</h3>
          <p>Try a different category or search term</p>
        </div>
      ) : (
        <>
          {/* Featured */}
          {featured && (
            <div className="marketplace-section">
              <div className="section-header">
                <h2>Featured Partner</h2>
              </div>
              <div className="featured-card" onClick={() => openListing(featured)}>
                <div className="featured-card-image">
                  <span className="featured-badge">⭐ Featured</span>
                  {getEmoji(featured.category)}
                </div>
                <div className="featured-card-body">
                  <h3>{featured.title}</h3>
                  <p className="vendor-name">{featured.vendor_name || 'Local Provider'}</p>
                  <div className="featured-meta">
                    <span className="featured-price">₹{featured.price}</span>
                    <span className="featured-rating">⭐ {featured.rating || '4.5'}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Popular grid */}
          {popular.length > 0 && (
            <div className="marketplace-section">
              <div className="section-header">
                <h2>Popular Near You</h2>
                <button className="see-all">See All</button>
              </div>
              <div className="popular-grid">
                {popular.map((listing) => (
                  <div key={listing.id} className="listing-card" onClick={() => openListing(listing)}>
                    <div className={`listing-card-image ${getBgClass(listing.category)}`}>
                      {getEmoji(listing.category)}
                    </div>
                    <div className="listing-card-body">
                      <h4>{listing.title}</h4>
                      <p className="listing-vendor">{listing.vendor_name || 'Local Provider'}</p>
                      <div className="listing-card-meta">
                        <span className="listing-price">₹{listing.price}</span>
                        <span className="listing-rating">⭐ {listing.rating || '4.5'}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Listing detail modal */}
      {selectedListing && (
        <div className="listing-detail-overlay" onClick={() => setSelectedListing(null)}>
          <div className="listing-detail-sheet" onClick={(e) => e.stopPropagation()}>
            <div className={`listing-detail-image ${getBgClass(selectedListing.category)}`}>
              {getEmoji(selectedListing.category)}
              <button className="listing-detail-close" onClick={() => setSelectedListing(null)}>✕</button>
            </div>
            <div className="listing-detail-body">
              <h2>{selectedListing.title}</h2>
              <p className="detail-vendor">by {selectedListing.vendor_name || 'Local Provider'}</p>

              <div className="detail-info-row">
                <div className="detail-info-item">
                  <span className="info-label">Price</span>
                  <span className="info-value">₹{selectedListing.price}</span>
                </div>
                <div className="detail-info-item">
                  <span className="info-label">Duration</span>
                  <span className="info-value">{selectedListing.duration || 'Varies'}</span>
                </div>
                <div className="detail-info-item">
                  <span className="info-label">Rating</span>
                  <span className="info-value">⭐ {selectedListing.rating || '4.5'}</span>
                </div>
              </div>

              {selectedListing.location_name && (
                <p className="listing-description">📍 {selectedListing.location_name}</p>
              )}

              <p className="listing-description">
                {selectedListing.description || 'No description available.'}
              </p>

              {bookingState.success ? (
                <div className="booking-success">
                  <div className="booking-success-icon">✅</div>
                  <h3>Booking Confirmed!</h3>
                  <p>Your booking for <strong>{selectedListing.title}</strong> has been placed.</p>
                  <button className="btn-book" onClick={() => {
                    setBookingState({ loading: false, success: false, error: null });
                    setSelectedListing(null);
                  }}>Done</button>
                </div>
              ) : (
                <div className="booking-form">
                  <div className="booking-form-row">
                    <label>
                      <span>Qty</span>
                      <input
                        type="number"
                        min="1"
                        max="20"
                        value={bookingForm.quantity}
                        onChange={(e) => setBookingForm({ ...bookingForm, quantity: Math.max(1, parseInt(e.target.value) || 1) })}
                      />
                    </label>
                    <label>
                      <span>Date</span>
                      <input
                        type="date"
                        value={bookingForm.booking_date}
                        min={new Date().toISOString().split('T')[0]}
                        onChange={(e) => setBookingForm({ ...bookingForm, booking_date: e.target.value })}
                      />
                    </label>
                  </div>
                  <div className="booking-total">
                    Total: <strong>₹{(selectedListing.price * bookingForm.quantity).toLocaleString()}</strong>
                  </div>
                  {bookingState.error && <p className="booking-error">{bookingState.error}</p>}
                  <div className="detail-action-row">
                    <button
                      className="btn-book"
                      disabled={bookingState.loading}
                      onClick={() => handleBookNow(selectedListing)}
                    >
                      {bookingState.loading ? 'Booking...' : 'Book Now'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Marketplace;
