const express = require('express');
const { body, validationResult } = require('express-validator');
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get user's private pins
router.get('/', authenticateToken, async (req, res) => {
  const { lat, lng, radius } = req.query;

  try {
    const rows = await db.callProc('sp_get_user_pins', [
      req.user.userId,
      lat ? parseFloat(lat) : null,
      lng ? parseFloat(lng) : null,
      radius ? parseInt(radius) : null
    ]);

    res.json({
      pins: rows,
      count: rows.length
    });
  } catch (error) {
    console.error('Error fetching private pins:', error);
    res.status(500).json({ error: 'Server error fetching pins' });
  }
});

// Create private pin
router.post('/', [
  authenticateToken,
  body('latitude').isFloat({ min: -90, max: 90 }),
  body('longitude').isFloat({ min: -180, max: 180 }),
  body('location_name').optional().trim(),
  body('title').optional().trim().isLength({ max: 255 }),
  body('note').optional().trim().isLength({ max: 500 }),
  body('photos').optional().isArray(),
  body('mood_emoji').optional().trim(),
  body('visit_date').isISO8601()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const {
    latitude, longitude, location_name, title, note,
    photos, voice_note_url, mood_emoji, visit_date
  } = req.body;

  try {
    const rows = await db.callProc('sp_create_pin', [
      req.user.userId,
      parseFloat(latitude), parseFloat(longitude),
      location_name || null, title || null, note || null,
      photos ? JSON.stringify(photos) : null,
      voice_note_url || null, mood_emoji || null, visit_date
    ]);

    // Check if this location should become a recommendation
    if (location_name) {
      try {
        await db.callProc('sp_update_recommendations', [
          parseFloat(longitude), parseFloat(latitude), location_name
        ]);
      } catch (e) {
        console.error('Error updating recommendations:', e);
      }
    }

    res.status(201).json({
      message: 'Private pin created successfully',
      pin: {
        ...rows[0],
        latitude,
        longitude
      }
    });
  } catch (error) {
    console.error('Error creating private pin:', error);
    res.status(500).json({ error: 'Server error creating pin' });
  }
});

// Get single pin
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const rows = await db.callProc('sp_get_pin_by_id', [
      parseInt(req.params.id), req.user.userId
    ]);

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Pin not found' });
    }

    res.json({ pin: rows[0] });
  } catch (error) {
    console.error('Error fetching pin:', error);
    res.status(500).json({ error: 'Server error fetching pin' });
  }
});

// Update private pin
router.patch('/:id', authenticateToken, async (req, res) => {
  const { location_name, title, note, photos, voice_note_url, mood_emoji } = req.body;

  if (!location_name && !title && !note && !photos && !voice_note_url && !mood_emoji) {
    return res.status(400).json({ error: 'No valid fields to update' });
  }

  try {
    const rows = await db.callProc('sp_update_pin', [
      parseInt(req.params.id), req.user.userId,
      location_name || null, title || null, note || null,
      photos ? JSON.stringify(photos) : null,
      voice_note_url || null, mood_emoji || null
    ]);

    res.json({
      message: 'Pin updated successfully',
      pin: rows[0]
    });
  } catch (error) {
    console.error('Error updating pin:', error);
    if ((error.message || '').includes('not found'))
      return res.status(404).json({ error: 'Pin not found' });
    res.status(500).json({ error: 'Server error updating pin' });
  }
});

// Delete private pin
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    await db.callProc('sp_delete_pin', [
      parseInt(req.params.id), req.user.userId
    ]);
    res.json({ message: 'Pin deleted successfully' });
  } catch (error) {
    console.error('Error deleting pin:', error);
    if ((error.message || '').includes('not found'))
      return res.status(404).json({ error: 'Pin not found' });
    res.status(500).json({ error: 'Server error deleting pin' });
  }
});

module.exports = router;
