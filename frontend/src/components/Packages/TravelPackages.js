import React, { useState, useEffect, useMemo } from 'react';
import { packagesAPI } from '../../utils/api';
import { Calendar, MapPin, Clock, Users, Star, ChevronLeft, ChevronRight, Search, Filter, X, Check } from 'lucide-react';
import './TravelPackages.css';

const CATEGORIES = ['All', 'Adventure', 'Trekking', 'Wellness', 'Cultural', 'Wildlife', 'Beach', 'Pilgrimage'];

function TravelPackages({ user, userLocation }) {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDate, setSelectedDate] = useState(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [bookingState, setBookingState] = useState({ loading: false, success: false, error: null });
  const [bookingForm, setBookingForm] = useState({ travelers: 1, travel_date: '', notes: '' });

  useEffect(() => { fetchPackages(); }, [activeCategory, selectedDate, userLocation]);

  const fetchPackages = async () => {
    try {
      setLoading(true);
      const params = {};
      if (activeCategory !== 'All') params.category = activeCategory;
      if (selectedDate) params.travel_date = selectedDate;
      if (userLocation) {
        params.lat = userLocation.lat;
        params.lng = userLocation.lng;
        params.radius = 100000;
      }
      const res = await packagesAPI.getAll(params);
      setPackages(res.data.packages || []);
    } catch (err) {
      console.error('Error fetching packages:', err);
      setPackages([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredPackages = packages.filter(p =>
    !searchQuery ||
    p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.destination.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.provider_name && p.provider_name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Calendar helpers
  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let d = 1; d <= daysInMonth; d++) days.push(d);
    return days;
  }, [currentMonth]);

  const monthLabel = currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const prevMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  const nextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));

  const handleDayClick = (day) => {
    if (!day) return;
    const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const today = new Date().toISOString().split('T')[0];
    if (dateStr < today) return;
    setSelectedDate(prev => prev === dateStr ? null : dateStr);
  };

  const isSelectedDay = (day) => {
    if (!day || !selectedDate) return false;
    const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return dateStr === selectedDate;
  };

  const isPastDay = (day) => {
    if (!day) return false;
    const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return dateStr < new Date().toISOString().split('T')[0];
  };

  const isToday = (day) => {
    if (!day) return false;
    const today = new Date();
    return day === today.getDate() && currentMonth.getMonth() === today.getMonth() && currentMonth.getFullYear() === today.getFullYear();
  };

  const openPackage = (pkg) => {
    setSelectedPackage(pkg);
    setBookingState({ loading: false, success: false, error: null });
    setBookingForm({ travelers: 1, travel_date: selectedDate || '', notes: '' });
  };

  const handleBook = async () => {
    if (!bookingForm.travel_date) {
      setBookingState({ loading: false, success: false, error: 'Please select a travel date' });
      return;
    }
    setBookingState({ loading: true, success: false, error: null });
    try {
      await packagesAPI.book(selectedPackage.id, {
        travelers: bookingForm.travelers,
        travel_date: bookingForm.travel_date,
        notes: bookingForm.notes || undefined
      });
      setBookingState({ loading: false, success: true, error: null });
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to book package';
      setBookingState({ loading: false, success: false, error: msg });
    }
  };

  const parseJSON = (val) => {
    if (!val) return [];
    if (Array.isArray(val)) return val;
    try { return JSON.parse(val); } catch { return []; }
  };

  // Get departure dates for the selected package to highlight on calendar
  const getDepartureDatesForMonth = (pkg) => {
    const dates = parseJSON(pkg?.departure_dates);
    const month = currentMonth.getMonth();
    const year = currentMonth.getFullYear();
    return dates.filter(d => {
      const dt = new Date(d);
      return dt.getMonth() === month && dt.getFullYear() === year;
    }).map(d => new Date(d).getDate());
  };

  return (
    <div className="packages-page">
      {/* Header */}
      <div className="packages-header">
        <div className="packages-header-content">
          <h1>Travel Packages</h1>
          <p>Discover curated travel experiences</p>
        </div>
        <div className="packages-search">
          <Search size={18} />
          <input
            type="text"
            placeholder="Search packages, destinations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Calendar */}
      <div className="packages-calendar-section">
        <div className="calendar-header">
          <h3><Calendar size={18} /> Select Travel Date</h3>
          {selectedDate && (
            <button className="clear-date-btn" onClick={() => setSelectedDate(null)}>
              <X size={14} /> Clear
            </button>
          )}
        </div>
        <div className="calendar-nav">
          <button onClick={prevMonth}><ChevronLeft size={20} /></button>
          <span className="calendar-month-label">{monthLabel}</span>
          <button onClick={nextMonth}><ChevronRight size={20} /></button>
        </div>
        <div className="calendar-weekdays">
          {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
            <div key={d} className="calendar-weekday">{d}</div>
          ))}
        </div>
        <div className="calendar-days">
          {calendarDays.map((day, i) => (
            <button
              key={i}
              className={`calendar-day ${!day ? 'empty' : ''} ${isSelectedDay(day) ? 'selected' : ''} ${isPastDay(day) ? 'past' : ''} ${isToday(day) ? 'today' : ''}`}
              onClick={() => handleDayClick(day)}
              disabled={!day || isPastDay(day)}
            >
              {day || ''}
            </button>
          ))}
        </div>
        {selectedDate && (
          <div className="calendar-selected-info">
            <Calendar size={14} />
            Showing packages available on <strong>{new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</strong>
          </div>
        )}
      </div>

      {/* Category chips */}
      <div className="packages-categories">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            className={`pkg-category-chip ${activeCategory === cat ? 'active' : ''}`}
            onClick={() => setActiveCategory(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Results */}
      <div className="packages-results">
        <div className="results-header">
          <h2>{filteredPackages.length} Package{filteredPackages.length !== 1 ? 's' : ''} Available</h2>
        </div>

        {loading ? (
          <div className="packages-loading"><div className="spinner"></div></div>
        ) : filteredPackages.length === 0 ? (
          <div className="packages-empty">
            <Compass size={48} strokeWidth={1} />
            <h3>No packages found</h3>
            <p>Try a different date, category, or search term</p>
          </div>
        ) : (
          <div className="packages-grid">
            {filteredPackages.map((pkg) => (
              <div key={pkg.id} className="package-card" onClick={() => openPackage(pkg)}>
                <div className="package-card-image">
                  <div className="package-category-badge">{pkg.category}</div>
                  {pkg.provider_verified ? <div className="package-verified-badge"><Check size={12} /> Verified</div> : null}
                </div>
                <div className="package-card-body">
                  <h3>{pkg.title}</h3>
                  <div className="package-meta">
                    <span className="package-dest"><MapPin size={14} /> {pkg.destination}</span>
                    <span className="package-duration"><Clock size={14} /> {pkg.duration_days} day{pkg.duration_days > 1 ? 's' : ''}</span>
                  </div>
                  <div className="package-provider">by {pkg.provider_name || 'Provider'}</div>
                  <div className="package-card-footer">
                    <div className="package-price">
                      <span className="price-amount">₹{Number(pkg.price).toLocaleString()}</span>
                      <span className="price-unit">/ person</span>
                    </div>
                    <div className="package-rating">
                      <Star size={14} fill="#F59E0B" stroke="#F59E0B" />
                      <span>{pkg.rating || '4.5'}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Package Detail Modal */}
      {selectedPackage && (
        <div className="pkg-detail-overlay" onClick={() => setSelectedPackage(null)}>
          <div className="pkg-detail-sheet" onClick={(e) => e.stopPropagation()}>
            <button className="pkg-detail-close" onClick={() => setSelectedPackage(null)}><X size={20} /></button>

            <div className="pkg-detail-hero">
              <div className="pkg-detail-category">{selectedPackage.category}</div>
              <h2>{selectedPackage.title}</h2>
              <div className="pkg-detail-provider">
                by {selectedPackage.provider_name}
                {selectedPackage.provider_verified ? <span className="verified-tag"><Check size={12} /> Verified</span> : null}
              </div>
            </div>

            <div className="pkg-detail-body">
              {/* Quick info */}
              <div className="pkg-info-grid">
                <div className="pkg-info-item">
                  <MapPin size={18} />
                  <div>
                    <span className="info-label">Destination</span>
                    <span className="info-value">{selectedPackage.destination}</span>
                  </div>
                </div>
                <div className="pkg-info-item">
                  <Clock size={18} />
                  <div>
                    <span className="info-label">Duration</span>
                    <span className="info-value">{selectedPackage.duration_days} day{selectedPackage.duration_days > 1 ? 's' : ''}</span>
                  </div>
                </div>
                <div className="pkg-info-item">
                  <Users size={18} />
                  <div>
                    <span className="info-label">Group Size</span>
                    <span className="info-value">Max {selectedPackage.max_travelers}</span>
                  </div>
                </div>
                <div className="pkg-info-item">
                  <Star size={18} fill="#F59E0B" stroke="#F59E0B" />
                  <div>
                    <span className="info-label">Rating</span>
                    <span className="info-value">{selectedPackage.rating || '4.5'} ({selectedPackage.total_bookings} bookings)</span>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="pkg-section">
                <h3>About This Package</h3>
                <p>{selectedPackage.description || 'No description available.'}</p>
              </div>

              {/* Includes */}
              {parseJSON(selectedPackage.includes).length > 0 && (
                <div className="pkg-section">
                  <h3>What's Included</h3>
                  <ul className="pkg-includes-list">
                    {parseJSON(selectedPackage.includes).map((item, i) => (
                      <li key={i}><Check size={16} className="include-check" /> {item}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Itinerary */}
              {parseJSON(selectedPackage.itinerary).length > 0 && (
                <div className="pkg-section">
                  <h3>Itinerary</h3>
                  <div className="pkg-itinerary">
                    {parseJSON(selectedPackage.itinerary).map((day, i) => (
                      <div key={i} className="itinerary-day">
                        <div className="itinerary-marker">
                          <div className="marker-dot" />
                          {i < parseJSON(selectedPackage.itinerary).length - 1 && <div className="marker-line" />}
                        </div>
                        <div className="itinerary-content">
                          <div className="itinerary-day-label">Day {day.day || i + 1}</div>
                          <h4>{day.title}</h4>
                          <p>{day.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Departure Dates */}
              {parseJSON(selectedPackage.departure_dates).length > 0 && (
                <div className="pkg-section">
                  <h3>Available Departure Dates</h3>
                  <div className="departure-dates">
                    {parseJSON(selectedPackage.departure_dates)
                      .filter(d => d >= new Date().toISOString().split('T')[0])
                      .slice(0, 6)
                      .map((d, i) => (
                        <button
                          key={i}
                          className={`departure-date-chip ${bookingForm.travel_date === d ? 'selected' : ''}`}
                          onClick={() => setBookingForm({ ...bookingForm, travel_date: d })}
                        >
                          {new Date(d + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </button>
                      ))}
                  </div>
                </div>
              )}

              {/* Booking */}
              {bookingState.success ? (
                <div className="pkg-booking-success">
                  <Check size={48} className="success-icon" />
                  <h3>Booking Confirmed!</h3>
                  <p>Your booking for <strong>{selectedPackage.title}</strong> has been placed.</p>
                  <button className="btn-pkg-book" onClick={() => { setBookingState({ loading: false, success: false, error: null }); setSelectedPackage(null); }}>Done</button>
                </div>
              ) : (
                <div className="pkg-booking-form">
                  <div className="pkg-booking-row">
                    <label>
                      <span>Travelers</span>
                      <input
                        type="number"
                        min="1"
                        max={selectedPackage.max_travelers}
                        value={bookingForm.travelers}
                        onChange={(e) => setBookingForm({ ...bookingForm, travelers: Math.max(1, parseInt(e.target.value) || 1) })}
                      />
                    </label>
                    <label>
                      <span>Travel Date</span>
                      <input
                        type="date"
                        value={bookingForm.travel_date}
                        min={new Date().toISOString().split('T')[0]}
                        onChange={(e) => setBookingForm({ ...bookingForm, travel_date: e.target.value })}
                      />
                    </label>
                  </div>
                  <div className="pkg-booking-total">
                    Total: <strong>₹{(selectedPackage.price * bookingForm.travelers).toLocaleString()}</strong>
                    <span className="total-breakdown">({bookingForm.travelers} × ₹{Number(selectedPackage.price).toLocaleString()})</span>
                  </div>
                  {bookingState.error && <p className="pkg-booking-error">{bookingState.error}</p>}
                  <button
                    className="btn-pkg-book"
                    disabled={bookingState.loading}
                    onClick={handleBook}
                  >
                    {bookingState.loading ? 'Booking...' : 'Book Now'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Compass({ size, strokeWidth }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/>
    </svg>
  );
}

export default TravelPackages;
