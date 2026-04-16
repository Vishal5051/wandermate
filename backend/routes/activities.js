const express = require('express');
const { body, validationResult } = require('express-validator');
const db = require('../config/database');
const { authenticateToken, checkVerified } = require('../middleware/auth');

const router = express.Router();

// Get activities within radius (for the social map)
router.get('/nearby', authenticateToken, async (req, res) => {
  const { lat, lng, radius = 10000, gender_filter } = req.query;

  if (!lat || !lng) {
    return res.status(400).json({ error: 'Latitude and longitude required' });
  }

  try {
    const rows = await db.callProc('sp_get_nearby_activities', [
      parseFloat(lat), parseFloat(lng), parseInt(radius),
      req.user.userId,
      gender_filter && gender_filter !== 'all' ? gender_filter : null
    ]);

    res.json({
      activities: rows,
      count: rows.length
    });
  } catch (error) {
    console.error('Error fetching nearby activities:', error);
    res.status(500).json({ error: 'Server error fetching activities' });
  }
});

// Create new activity
router.post('/', [
  authenticateToken,
  checkVerified,
  body('title').trim().isLength({ min: 3, max: 255 }),
  body('description').optional().trim(),
  body('activity_type').isIn(['Hike', 'Cafe', 'Night Out', 'Day Trip', 'Skill Share', 'Language Exchange', 'Other']),
  body('latitude').isFloat({ min: -90, max: 90 }),
  body('longitude').isFloat({ min: -180, max: 180 }),
  body('location_name').trim().isLength({ min: 2 }),
  body('start_time').isISO8601(),
  body('capacity').optional().isInt({ min: 2, max: 50 }),
  body('gender_filter').optional().isIn(['all', 'male', 'female'])
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const {
    title, description, activity_type, latitude, longitude,
    location_name, start_time, end_time, capacity, gender_filter, min_age, max_age
  } = req.body;

  try {
    const rows = await db.callProc('sp_create_activity', [
      req.user.userId, title, description || null, activity_type,
      parseFloat(latitude), parseFloat(longitude), location_name,
      start_time, end_time || null, capacity || null,
      gender_filter || null, min_age || null, max_age || null
    ]);

    const activity = rows[0];

    res.status(201).json({
      message: 'Activity created successfully',
      activity: {
        ...activity,
        latitude,
        longitude
      }
    });
  } catch (error) {
    console.error('Error creating activity:', error);
    res.status(500).json({ error: 'Server error creating activity' });
  }
});

// Get single activity details
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const rows = await db.callProc('sp_get_activity_by_id', [
      parseInt(req.params.id), req.user.userId
    ]);

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Activity not found' });
    }

    // Get list of attendees
    const attendees = await db.callProc('sp_get_activity_attendees', [parseInt(req.params.id)]);

    res.json({
      activity: rows[0],
      attendees
    });
  } catch (error) {
    console.error('Error fetching activity:', error);
    res.status(500).json({ error: 'Server error fetching activity' });
  }
});

// RSVP to activity
router.post('/:id/rsvp', authenticateToken, async (req, res) => {
  try {
    await db.callProc('sp_rsvp_activity', [
      parseInt(req.params.id), req.user.userId
    ]);
    res.json({ message: 'Successfully RSVPed to activity' });
  } catch (error) {
    console.error('Error RSVPing to activity:', error);
    // Map MySQL SIGNAL errors to HTTP responses
    const msg = error.message || '';
    if (msg.includes('not found')) return res.status(404).json({ error: msg });
    if (msg.includes('own activity') || msg.includes('full') || msg.includes('Already'))
      return res.status(400).json({ error: msg });
    res.status(500).json({ error: 'Server error processing RSVP' });
  }
});

// Cancel RSVP
router.delete('/:id/rsvp', authenticateToken, async (req, res) => {
  try {
    await db.callProc('sp_cancel_rsvp', [
      parseInt(req.params.id), req.user.userId
    ]);
    res.json({ message: 'RSVP cancelled successfully' });
  } catch (error) {
    console.error('Error cancelling RSVP:', error);
    if ((error.message || '').includes('not found'))
      return res.status(404).json({ error: 'RSVP not found' });
    res.status(500).json({ error: 'Server error cancelling RSVP' });
  }
});

// Delete activity (host only)
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    await db.callProc('sp_delete_activity', [
      parseInt(req.params.id), req.user.userId
    ]);
    res.json({ message: 'Activity deleted successfully' });
  } catch (error) {
    console.error('Error deleting activity:', error);
    if ((error.message || '').includes('not found'))
      return res.status(404).json({ error: 'Activity not found or unauthorized' });
    res.status(500).json({ error: 'Server error deleting activity' });
  }
});

module.exports = router;
