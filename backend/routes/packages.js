const express = require('express');
const { body, validationResult } = require('express-validator');
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get all travel packages (with optional filters)
router.get('/', authenticateToken, async (req, res) => {
  const { category, travel_date, lat, lng, radius = 50000 } = req.query;

  try {
    const rows = await db.callProc('sp_get_travel_packages', [
      category || null,
      travel_date || null,
      lat ? parseFloat(lat) : null,
      lng ? parseFloat(lng) : null,
      parseInt(radius)
    ]);

    res.json({ packages: rows, count: rows.length });
  } catch (error) {
    console.error('Error fetching packages:', error);
    res.status(500).json({ error: 'Server error fetching packages' });
  }
});

// Get single package
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const rows = await db.callProc('sp_get_package_by_id', [parseInt(req.params.id)]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Package not found' });
    }
    res.json({ package: rows[0] });
  } catch (error) {
    console.error('Error fetching package:', error);
    res.status(500).json({ error: 'Server error fetching package' });
  }
});

// Get provider profile
router.get('/provider/me', authenticateToken, async (req, res) => {
  try {
    const rows = await db.callProc('sp_get_or_create_provider', [req.user.userId]);
    res.json({ provider: rows[0] });
  } catch (error) {
    console.error('Error fetching provider:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update provider profile
router.patch('/provider/me', authenticateToken, async (req, res) => {
  const { company_name, description, contact_phone, contact_email, website, latitude, longitude, location_name } = req.body;
  try {
    const rows = await db.callProc('sp_update_provider', [
      req.user.userId, company_name || null, description || null,
      contact_phone || null, contact_email || null, website || null,
      latitude != null ? parseFloat(latitude) : null,
      longitude != null ? parseFloat(longitude) : null,
      location_name || null
    ]);
    res.json({ provider: rows[0] });
  } catch (error) {
    console.error('Error updating provider:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get provider's own packages
router.get('/provider/packages', authenticateToken, async (req, res) => {
  try {
    const rows = await db.callProc('sp_get_provider_packages', [req.user.userId]);
    res.json({ packages: rows, count: rows.length });
  } catch (error) {
    console.error('Error fetching provider packages:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create a travel package
router.post('/', [
  authenticateToken,
  body('title').trim().isLength({ min: 3, max: 255 }),
  body('destination').trim().isLength({ min: 2 }),
  body('duration_days').isInt({ min: 1, max: 90 }),
  body('price').isFloat({ min: 0 }),
  body('available_from').isISO8601(),
  body('available_to').isISO8601(),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const {
    title, description, destination, destination_latitude, destination_longitude,
    duration_days, price, max_travelers, includes, itinerary,
    available_from, available_to, departure_dates, category, image_url
  } = req.body;

  try {
    const rows = await db.callProc('sp_create_travel_package', [
      req.user.userId, title, description || null, destination,
      destination_latitude ? parseFloat(destination_latitude) : null,
      destination_longitude ? parseFloat(destination_longitude) : null,
      parseInt(duration_days), parseFloat(price),
      max_travelers ? parseInt(max_travelers) : null,
      includes ? JSON.stringify(includes) : null,
      itinerary ? JSON.stringify(itinerary) : null,
      available_from, available_to,
      departure_dates ? JSON.stringify(departure_dates) : null,
      category || null, image_url || null
    ]);

    res.status(201).json({ message: 'Package created', package: rows[0] });
  } catch (error) {
    console.error('Error creating package:', error);
    res.status(500).json({ error: 'Server error creating package' });
  }
});

// Update a package
router.patch('/:id', authenticateToken, async (req, res) => {
  const {
    title, description, destination, destination_latitude, destination_longitude,
    duration_days, price, max_travelers, includes, itinerary,
    available_from, available_to, departure_dates, category, image_url
  } = req.body;

  try {
    const rows = await db.callProc('sp_update_travel_package', [
      parseInt(req.params.id), req.user.userId,
      title || null, description || null, destination || null,
      destination_latitude != null ? parseFloat(destination_latitude) : null,
      destination_longitude != null ? parseFloat(destination_longitude) : null,
      duration_days != null ? parseInt(duration_days) : null,
      price != null ? parseFloat(price) : null,
      max_travelers != null ? parseInt(max_travelers) : null,
      includes ? JSON.stringify(includes) : null,
      itinerary ? JSON.stringify(itinerary) : null,
      available_from || null, available_to || null,
      departure_dates ? JSON.stringify(departure_dates) : null,
      category || null, image_url || null
    ]);

    res.json({ message: 'Package updated', package: rows[0] });
  } catch (error) {
    console.error('Error updating package:', error);
    res.status(500).json({ error: 'Server error updating package' });
  }
});

// Delete a package
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    await db.callProc('sp_delete_travel_package', [parseInt(req.params.id), req.user.userId]);
    res.json({ message: 'Package deleted' });
  } catch (error) {
    if (error.message && error.message.includes('not found')) {
      return res.status(404).json({ error: 'Package not found or unauthorized' });
    }
    console.error('Error deleting package:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Book a package
router.post('/:id/book', [
  authenticateToken,
  body('travelers').optional().isInt({ min: 1 }),
  body('travel_date').isISO8601(),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { travelers = 1, travel_date, notes } = req.body;

  try {
    const pkgRows = await db.callProc('sp_get_package_by_id', [parseInt(req.params.id)]);
    if (pkgRows.length === 0) {
      return res.status(404).json({ error: 'Package not found' });
    }

    const total_price = pkgRows[0].price * travelers;

    const rows = await db.callProc('sp_book_travel_package', [
      parseInt(req.params.id), req.user.userId,
      parseInt(travelers), travel_date, total_price, notes || null
    ]);

    res.status(201).json({ message: 'Booking created', booking: rows[0] });
  } catch (error) {
    console.error('Error booking package:', error);
    res.status(500).json({ error: 'Server error booking package' });
  }
});

// Get user's package bookings
router.get('/bookings/my', authenticateToken, async (req, res) => {
  try {
    const rows = await db.callProc('sp_get_user_package_bookings', [req.user.userId]);
    res.json({ bookings: rows, count: rows.length });
  } catch (error) {
    console.error('Error fetching bookings:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get provider's package bookings
router.get('/bookings/provider', authenticateToken, async (req, res) => {
  try {
    const rows = await db.callProc('sp_get_provider_package_bookings', [req.user.userId]);
    res.json({ bookings: rows, count: rows.length });
  } catch (error) {
    console.error('Error fetching provider bookings:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update package booking status
router.patch('/bookings/:id/status', [
  authenticateToken,
  body('status').isIn(['confirmed', 'cancelled'])
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const rows = await db.callProc('sp_update_package_booking_status', [
      parseInt(req.params.id), req.user.userId, req.body.status
    ]);
    res.json({ message: `Booking ${req.body.status}`, booking: rows[0] });
  } catch (error) {
    if (error.message && error.message.includes('not found')) {
      return res.status(404).json({ error: 'Booking not found or unauthorized' });
    }
    console.error('Error updating booking:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
