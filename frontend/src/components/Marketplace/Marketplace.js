import React, { useState, useEffect, useCallback } from 'react';
import { marketplaceAPI, bookingAPI } from '../../utils/api';
import { Search, Star, X, Check } from 'lucide-react';
import ReportModal from '../Safety/ReportModal';
import './Marketplace.css';
import { motion, AnimatePresence } from 'framer-motion';

const CATEGORIES = ['All', 'Yoga', 'Rafting', 'Stays', 'Camping', 'Cafe', 'Photography', 'Adventure'];

const CATEGORY_EMOJIS = {
  Yoga: '🧘', Rafting: '🚣', Stays: '🏡', Camping: '⛺',
  Cafe: '☕', Photography: '📸', Adventure: '🏔️'
};


function Marketplace({ user, userLocation }) {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedListing, setSelectedListing] = useState(null);
  const [showReport, setShowReport] = useState(false);
  const [bookingState, setBookingState] = useState({ loading: false, success: false, error: null });
  const [bookingForm, setBookingForm] = useState({ quantity: 1, booking_date: '', notes: '' });

  const fetchListings = useCallback(async () => {
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
  }, [activeCategory, userLocation]);

  useEffect(() => { fetchListings(); }, [fetchListings]);

  const filteredListings = listings.filter(l =>
    !searchQuery || l.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (l.vendor_name && l.vendor_name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const getEmoji = (cat) => CATEGORY_EMOJIS[cat] || '🎯';

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

  if (loading) return (
    <div className="loading-state">
      <div className="spinner-modern"></div>
      <p>Loading the marketplace...</p>
    </div>
  );

  return (
    <div className="marketplace-page">
      <div className="marketplace-top-bar">
        <h1>Marketplace</h1>
        <p>Verified stays & premium local experiences</p>
        <div className="marketplace-search-wrapper">
          <Search className="search-icon" size={20} />
          <input
            type="text"
            className="modern-search-input"
            placeholder="Search activities, stays, cafes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="marketplace-categories">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            className={`cat-pill ${activeCategory === cat ? 'active' : ''}`}
            onClick={() => setActiveCategory(cat)}
          >
            {cat !== 'All' && <span>{getEmoji(cat)}</span>}
            {cat}
          </button>
        ))}
      </div>

      <motion.div layout className="marketplace-grid">
        <AnimatePresence mode="popLayout">
          {filteredListings.map((listing, idx) => (
            <motion.div 
              key={listing.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ delay: idx * 0.05 }}
              className="premium-listing-card" 
              onClick={() => openListing(listing)}
            >
              <div className="card-visual">
                {getEmoji(listing.category)}
                <span className="cat-tag">{listing.category}</span>
              </div>
              <div className="card-detail">
                <h3>{listing.title}</h3>
                <span className="vendor">{listing.vendor_name || 'Local Guide'}</span>
                
                <div className="card-footer">
                  <div className="price-box">
                    <span className="lbl">FROM</span>
                    <span className="val">₹{listing.price.toLocaleString()}</span>
                  </div>
                  <div className="star-box">
                    <Star size={14} fill="currentColor" />
                    <span>{listing.rating || '4.8'}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>

      {/* Listing detail modal */}
      <AnimatePresence>
        {selectedListing && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="listing-overlay-v2" 
            onClick={() => setSelectedListing(null)}
          >
            <motion.div 
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 50, opacity: 0 }}
              className="listing-sheet-v2" 
              onClick={(e) => e.stopPropagation()}
            >
              <div className="sheet-visual">
                {getEmoji(selectedListing.category)}
                <button className="close-sheet" onClick={() => setSelectedListing(null)}>
                  <X size={20} />
                </button>
              </div>
              
              <div className="sheet-content">
                <h2>{selectedListing.title}</h2>
                <span className="vendor-sub">Curated by {selectedListing.vendor_name || 'Verified Provider'}</span>

                <p className="description">
                  {selectedListing.description || 'This exclusive experience offers a deep dive into the local culture and landscapes of the region. Perfect for adventurers seeking authenticity.'}
                </p>

                <div className="booking-panel">
                  {bookingState.success ? (
                    <div className="text-center py-4">
                       <Check size={48} color="var(--teal)" className="mx-auto mb-3" />
                       <h3 className="mb-2">Interest Registered!</h3>
                       <p className="mb-4">The vendor will contact you shortly.</p>
                       <button className="btn-modern btn-modern-primary btn-full" onClick={() => setSelectedListing(null)}>Return Home</button>
                    </div>
                  ) : (
                    <>
                      <div className="qty-pill">
                        <span className="font-bold">Quantity</span>
                        <input
                          type="number"
                          min="1"
                          value={bookingForm.quantity}
                          onChange={(e) => setBookingForm({ ...bookingForm, quantity: Math.max(1, parseInt(e.target.value) || 1) })}
                        />
                      </div>
                      
                      <div className="date-pill">
                        <span className="font-bold">Travel Date</span>
                        <input
                          type="date"
                          value={bookingForm.booking_date}
                          onChange={(e) => setBookingForm({ ...bookingForm, booking_date: e.target.value })}
                        />
                      </div>

                      <div className="booking-total-row">
                         <span className="total-lbl">Total Est.</span>
                         <span className="total-val">₹{(selectedListing.price * bookingForm.quantity).toLocaleString()}</span>
                      </div>

                      <button
                        className="btn-modern btn-modern-primary btn-full mt-4"
                        disabled={bookingState.loading}
                        onClick={() => handleBookNow(selectedListing)}
                      >
                        {bookingState.loading ? 'Reserving...' : 'Book Experience →'}
                      </button>
                      {bookingState.error && <p className="text-red-500 text-sm mt-2">❌ {bookingState.error}</p>}
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Modals */}
      {showReport && selectedListing && (
        <ReportModal 
          entityId={selectedListing.id} 
          entityType="listing" 
          entityName={selectedListing.title} 
          onClose={() => setShowReport(false)} 
        />
      )}
    </div>
  );
}

export default Marketplace;
