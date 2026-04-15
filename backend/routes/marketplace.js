const express = require('express');
const { body, validationResult } = require('express-validator');
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get my listings (vendor's own listings)
router.get('/my-listings', authenticateToken, async (req, res) => {
  try {
    const rows = await db.callProc('sp_get_my_marketplace_listings', [req.user.userId]);
    res.json({ listings: rows, count: rows.length });
  } catch (error) {
    console.error('Error fetching vendor listings:', error);
    res.status(500).json({ error: 'Server error fetching your listings' });
  }
});

// Get all marketplace listings (with optional category filter)
router.get('/listings', authenticateToken, async (req, res) => {
  const { category, lat, lng, radius = 50000 } = req.query;

  try {
    const rows = await db.callProc('sp_get_marketplace_listings', [
      category || null,
      lat ? parseFloat(lat) : null,
      lng ? parseFloat(lng) : null,
      parseInt(radius)
    ]);

    res.json({
      listings: rows,
      count: rows.length
    });
  } catch (error) {
    console.error('Error fetching marketplace listings:', error);
    res.status(500).json({ error: 'Server error fetching listings' });
  }
});

// Get single listing details
router.get('/listings/:id', authenticateToken, async (req, res) => {
  try {
    const rows = await db.callProc('sp_get_listing_by_id', [parseInt(req.params.id)]);

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Listing not found' });
    }

    res.json({ listing: rows[0] });
  } catch (error) {
    console.error('Error fetching listing:', error);
    res.status(500).json({ error: 'Server error fetching listing' });
  }
});

// Get vendor details
router.get('/vendors/:id', authenticateToken, async (req, res) => {
  try {
    const rows = await db.callProc('sp_get_vendor_by_id', [parseInt(req.params.id)]);

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Vendor not found' });
    }

    // Also fetch vendor's listings
    const listings = await db.callProc('sp_get_vendor_listings', [parseInt(req.params.id)]);

    res.json({
      vendor: rows[0],
      listings
    });
  } catch (error) {
    console.error('Error fetching vendor:', error);
    res.status(500).json({ error: 'Server error fetching vendor' });
  }
});

// Create a new listing (vendor / admin)
router.post('/listings', [
  authenticateToken,
  body('title').trim().isLength({ min: 3, max: 255 }),
  body('description').optional().trim(),
  body('category').isIn(['Yoga', 'Rafting', 'Stays', 'Camping', 'Cafe', 'Photography', 'Adventure', 'Other']),
  body('price').isFloat({ min: 0 }),
  body('latitude').isFloat({ min: -90, max: 90 }),
  body('longitude').isFloat({ min: -180, max: 180 }),
  body('location_name').trim().isLength({ min: 2 }),
  body('vendor_name').trim().isLength({ min: 2 })
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const {
    title, description, category, price, latitude, longitude,
    location_name, vendor_name, duration, contact_phone, contact_email, image_url
  } = req.body;

  try {
    const rows = await db.callProc('sp_create_marketplace_listing', [
      req.user.userId, title, description || null, category,
      parseFloat(price), parseFloat(latitude), parseFloat(longitude),
      location_name, vendor_name, duration || null,
      contact_phone || null, contact_email || null, image_url || null
    ]);

    res.status(201).json({
      message: 'Listing created successfully',
      listing: rows[0]
    });
  } catch (error) {
    console.error('Error creating listing:', error);
    res.status(500).json({ error: 'Server error creating listing' });
  }
});

// Delete a listing
router.delete('/listings/:id', authenticateToken, async (req, res) => {
  try {
    await db.callProc('sp_delete_marketplace_listing', [
      parseInt(req.params.id),
      req.user.userId
    ]);

    res.json({ message: 'Listing deleted successfully' });
  } catch (error) {
    if (error.message && error.message.includes('not found')) {
      return res.status(404).json({ error: 'Listing not found or unauthorized' });
    }
    console.error('Error deleting listing:', error);
    res.status(500).json({ error: 'Server error deleting listing' });
  }
});

// Update a listing
router.patch('/listings/:id', [
  authenticateToken,
  body('title').optional().trim().isLength({ min: 3, max: 255 }),
  body('price').optional().isFloat({ min: 0 }),
  body('category').optional().isIn(['Yoga', 'Rafting', 'Stays', 'Camping', 'Cafe', 'Photography', 'Adventure', 'Other'])
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const {
    title, description, category, price, latitude, longitude,
    location_name, vendor_name, duration, contact_phone, contact_email, image_url
  } = req.body;

  try {
    const rows = await db.callProc('sp_update_marketplace_listing', [
      parseInt(req.params.id), req.user.userId,
      title || null, description || null, category || null,
      price != null ? parseFloat(price) : null,
      latitude != null ? parseFloat(latitude) : null,
      longitude != null ? parseFloat(longitude) : null,
      location_name || null, vendor_name || null, duration || null,
      contact_phone || null, contact_email || null, image_url || null
    ]);

    res.json({ message: 'Listing updated', listing: rows[0] });
  } catch (error) {
    if (error.message && error.message.includes('not found')) {
      return res.status(404).json({ error: 'Listing not found or unauthorized' });
    }
    console.error('Error updating listing:', error);
    res.status(500).json({ error: 'Server error updating listing' });
  }
});

module.exports = router;

// =============================================
// BOOKING ROUTES
// =============================================

const bookingRouter = express.Router();

// Create a booking
bookingRouter.post('/', [
  authenticateToken,
  body('listing_id').isInt({ min: 1 }),
  body('quantity').optional().isInt({ min: 1 }),
  body('booking_date').optional().isISO8601(),
  body('notes').optional().trim()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { listing_id, quantity = 1, booking_date, notes } = req.body;

  try {
    // Get listing to calculate total
    const listingRows = await db.callProc('sp_get_listing_by_id', [listing_id]);
    if (listingRows.length === 0) {
      return res.status(404).json({ error: 'Listing not found' });
    }

    const total_price = listingRows[0].price * quantity;

    const rows = await db.callProc('sp_create_booking', [
      listing_id,
      req.user.userId,
      quantity,
      total_price,
      booking_date || null,
      notes || null
    ]);

    res.status(201).json({
      message: 'Booking created successfully',
      booking: rows[0]
    });
  } catch (error) {
    console.error('Error creating booking:', error);
    res.status(500).json({ error: 'Server error creating booking' });
  }
});

// Get my bookings (traveler)
bookingRouter.get('/my', authenticateToken, async (req, res) => {
  try {
    const rows = await db.callProc('sp_get_user_bookings', [req.user.userId]);
    res.json({ bookings: rows, count: rows.length });
  } catch (error) {
    console.error('Error fetching user bookings:', error);
    res.status(500).json({ error: 'Server error fetching bookings' });
  }
});

// Get vendor bookings (vendor sees all bookings on their listings)
bookingRouter.get('/vendor', authenticateToken, async (req, res) => {
  try {
    const rows = await db.callProc('sp_get_vendor_bookings', [req.user.userId]);
    res.json({ bookings: rows, count: rows.length });
  } catch (error) {
    console.error('Error fetching vendor bookings:', error);
    res.status(500).json({ error: 'Server error fetching vendor bookings' });
  }
});

// Update booking status (vendor confirms/cancels)
bookingRouter.patch('/:id/status', [
  authenticateToken,
  body('status').isIn(['confirmed', 'cancelled'])
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const rows = await db.callProc('sp_update_booking_status', [
      parseInt(req.params.id),
      req.user.userId,
      req.body.status
    ]);

    res.json({ message: `Booking ${req.body.status}`, booking: rows[0] });
  } catch (error) {
    if (error.message && error.message.includes('not found')) {
      return res.status(404).json({ error: 'Booking not found or unauthorized' });
    }
    console.error('Error updating booking status:', error);
    res.status(500).json({ error: 'Server error updating booking' });
  }
});

// Cancel my booking (traveler)
bookingRouter.delete('/:id', authenticateToken, async (req, res) => {
  try {
    await db.callProc('sp_cancel_booking', [
      parseInt(req.params.id),
      req.user.userId
    ]);

    res.json({ message: 'Booking cancelled' });
  } catch (error) {
    if (error.message && error.message.includes('not found')) {
      return res.status(404).json({ error: 'Booking not found or unauthorized' });
    }
    console.error('Error cancelling booking:', error);
    res.status(500).json({ error: 'Server error cancelling booking' });
  }
});

module.exports.bookingRouter = bookingRouter;
