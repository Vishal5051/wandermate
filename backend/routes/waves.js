const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateToken: auth } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

// Create a wave (host a cab)
router.post('/', auth, [
  body('origin_name').notEmpty().withMessage('Origin name is required'),
  body('origin_latitude').isFloat(),
  body('origin_longitude').isFloat(),
  body('destination_name').notEmpty().withMessage('Destination name is required'),
  body('destination_latitude').isFloat(),
  body('destination_longitude').isFloat(),
  body('departure_time').isISO8601().withMessage('Valid departure time is required'),
  body('capacity').isInt({ min: 1 }).withMessage('Capacity must be at least 1'),
  body('price_per_seat').isFloat({ min: 0 }).withMessage('Price per seat must be >= 0'),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log('Validation errors:', errors.array());
    return res.status(400).json({ 
      error: errors.array()[0].msg,
      errors: errors.array() 
    });
  }

  console.log('--- CREATE WAVE DEBUG ---');
  console.log('User:', req.user);
  console.log('Body:', req.body);

  const {
    origin_name, origin_latitude, origin_longitude,
    destination_name, destination_latitude, destination_longitude,
    departure_time, capacity, price_per_seat, description, vibe_tags
  } = req.body;

  if (!req.user || !req.user.userId) {
    return res.status(401).json({ error: 'User ID missing in token' });
  }

  try {
    const depTime = new Date(departure_time);
    if (isNaN(depTime.getTime())) {
      console.log('Invalid departure time provided:', departure_time);
      return res.status(400).json({ error: 'Invalid departure time format' });
    }

    const result = await db.query(
      `INSERT INTO waves 
       (host_id, origin_name, origin_latitude, origin_longitude, 
        destination_name, destination_latitude, destination_longitude,
        departure_time, capacity, price_per_seat, description, vibe_tags)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        req.user.userId, 
        origin_name || 'Unknown', 
        origin_latitude || 0, 
        origin_longitude || 0,
        destination_name || 'Unknown', 
        destination_latitude || 0, 
        destination_longitude || 0,
        depTime, 
        capacity || 1, 
        price_per_seat || 0, 
        description || null, 
        vibe_tags ? JSON.stringify(vibe_tags) : null
      ]
    );

    const waves = await db.query('SELECT * FROM waves WHERE id = ?', [result.insertId]);
    res.status(201).json(waves[0]);
  } catch (error) {
    console.error('--- CREATE WAVE ERROR ---');
    console.error('Message:', error.message);
    console.error('Code:', error.code);
    console.error('Stack:', error.stack);
    res.status(500).json({ 
      error: 'Server error: ' + (error.sqlMessage || error.message || 'Unknown error'),
      details: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
});

// Search all available waves
router.get('/', async (req, res) => {
  try {
    const { origin, destination, date } = req.query;
    let query = `
      SELECT w.*, u.full_name as host_name, u.trust_score, u.profile_photo 
      FROM waves w
      JOIN users u ON w.host_id = u.id
      WHERE w.status = 'active'
    `;
    const params = [];

    if (origin) {
      query += ` AND w.origin_name LIKE ?`;
      params.push(`%${origin}%`);
    }
    if (destination) {
      query += ` AND w.destination_name LIKE ?`;
      params.push(`%${destination}%`);
    }
    if (date) {
      query += ` AND DATE(w.departure_time) = DATE(?)`;
      params.push(date);
    }
    
    query += ` ORDER BY w.departure_time ASC`;

    const waves = await db.query(query, params);
    res.json(waves);
  } catch (error) {
    console.error('Search waves error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get user's hosted and joined waves
router.get('/my-waves', auth, async (req, res) => {
  try {
    // Get hosted waves
    const hosted = await db.query(
      `SELECT w.*, 
        (SELECT COUNT(*) FROM wave_requests WHERE wave_id = w.id AND status = 'pending') as pending_requests 
       FROM waves w WHERE host_id = ? ORDER BY departure_time DESC`,
       [req.user.userId]
    );

    // Get joined/requested waves
    const requested = await db.query(
      `SELECT wr.*, w.origin_name, w.destination_name, w.departure_time, w.host_id, u.full_name as host_name
       FROM wave_requests wr
       JOIN waves w ON wr.wave_id = w.id
       JOIN users u ON w.host_id = u.id
       WHERE wr.requester_id = ? ORDER BY wr.created_at DESC`,
       [req.user.userId]
    );

    res.json({ hosted, requested });
  } catch (error) {
    console.error('Get my waves error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get specific wave details
router.get('/:id', async (req, res) => {
  try {
    const waves = await db.query(
      `SELECT w.*, u.full_name as host_name, u.bio, u.trust_score, u.verification_level
       FROM waves w
       JOIN users u ON w.host_id = u.id
       WHERE w.id = ?`,
      [req.params.id]
    );

    if (waves.length === 0) {
      return res.status(404).json({ error: 'Wave not found' });
    }

    const wave = waves[0];

    // Get passengers (accepted requests)
    const passengers = await db.query(
      `SELECT u.id, u.full_name, u.profile_photo, wr.seats_requested
       FROM wave_requests wr
       JOIN users u ON wr.requester_id = u.id
       WHERE wr.wave_id = ? AND wr.status = 'approved'`,
      [req.params.id]
    );

    wave.passengers = passengers;
    res.json(wave);
  } catch (error) {
    console.error('Get wave details error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Request to join a wave
router.post('/:id/join', auth, [
  body('seats_requested').isInt({ min: 1 }).withMessage('At least 1 seat must be requested'),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const waveId = req.params.id;
    const { seats_requested } = req.body;
    const userId = req.user.userId;

    // Get wave info
    const waves = await db.query('SELECT * FROM waves WHERE id = ? AND status = "active"', [waveId]);
    if (waves.length === 0) {
      return res.status(404).json({ error: 'Active wave not found' });
    }
    const wave = waves[0];

    if (wave.host_id === userId) {
      return res.status(400).json({ error: 'Cannot join your own wave' });
    }

    if (wave.current_travelers + seats_requested > wave.capacity) {
      return res.status(400).json({ error: 'Not enough seats available' });
    }

    // Check if already requested
    const existing = await db.query('SELECT * FROM wave_requests WHERE wave_id = ? AND requester_id = ?', [waveId, userId]);
    if (existing.length > 0) {
      return res.status(400).json({ error: 'You have already requested to join this wave' });
    }

    // Calculate price with 10% service fee
    const basePrice = wave.price_per_seat * seats_requested;
    const serviceFee = basePrice * 0.10;
    const totalPrice = basePrice + serviceFee;

    const result = await db.query(
      `INSERT INTO wave_requests (wave_id, requester_id, seats_requested, total_price, service_fee)
       VALUES (?, ?, ?, ?, ?)`,
      [waveId, userId, seats_requested, totalPrice, serviceFee]
    );

    res.status(201).json({ 
      id: result.insertId,
      wave_id: waveId,
      status: 'pending',
      total_price: totalPrice,
      message: 'Request sent to host'
    });
  } catch (error) {
    console.error('Join wave error:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: 'Already requested' });
    }
    res.status(500).json({ error: 'Server error' });
  }
});

// Host action: Get requests for a wave
router.get('/:id/requests', auth, async (req, res) => {
  try {
    const waves = await db.query('SELECT host_id FROM waves WHERE id = ?', [req.params.id]);
    if (waves.length === 0 || waves[0].host_id !== req.user.userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const requests = await db.query(
      `SELECT wr.*, u.full_name, u.trust_score, u.profile_photo
       FROM wave_requests wr
       JOIN users u ON wr.requester_id = u.id
       WHERE wr.wave_id = ?`,
      [req.params.id]
    );

    res.json(requests);
  } catch (error) {
    console.error('Get requests error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Host action: Approve or reject a request
router.put('/requests/:reqId', auth, async (req, res) => {
  try {
    const { status } = req.body; // 'approved' or 'rejected'
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    // Check if host owns the wave
    const requests = await db.query(
      `SELECT wr.*, w.host_id, w.capacity, w.current_travelers 
       FROM wave_requests wr
       JOIN waves w ON wr.wave_id = w.id
       WHERE wr.id = ?`,
      [req.params.reqId]
    );

    if (requests.length === 0) return res.status(404).json({ error: 'Request not found' });
    const request = requests[0];

    if (request.host_id !== req.user.userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({ error: 'Request is already processed' });
    }

    const connection = await db.pool.getConnection();
    await connection.beginTransaction();

    try {
      await connection.query('UPDATE wave_requests SET status = ? WHERE id = ?', [status, request.id]);

      if (status === 'approved') {
        const newTravelers = request.current_travelers + request.seats_requested;
        if (newTravelers > request.capacity) {
          throw new Error('Not enough capacity remaining');
        }
        await connection.query('UPDATE waves SET current_travelers = ? WHERE id = ?', [newTravelers, request.wave_id]);
      }

      await connection.commit();
      res.json({ success: true, status });
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Process request error:', error);
    res.status(500).json({ error: error.message || 'Server error' });
  }
});

module.exports = router;
