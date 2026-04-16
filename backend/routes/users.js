const express = require('express');
const { body, validationResult } = require('express-validator');
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = express.Router();

// Get current user profile
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const rows = await db.callProc('sp_get_user_profile', [req.user.userId]);

    if (rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user: rows[0] });
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ error: 'Server error fetching profile' });
  }
});

// Get user by ID or username
router.get('/:identifier', authenticateToken, async (req, res) => {
  try {
    const isNumeric = /^\d+$/.test(req.params.identifier);
    let rows;

    if (isNumeric) {
      rows = await db.callProc('sp_get_user_by_id', [parseInt(req.params.identifier)]);
    } else {
      rows = await db.callProc('sp_get_user_by_username', [req.params.identifier]);
    }

    if (rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get user's hosted activities
    const activities = await db.callProc('sp_get_user_upcoming_activities', [rows[0].id]);

    res.json({
      user: rows[0],
      upcoming_activities: activities
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Server error fetching user' });
  }
});

// Update user profile
router.patch('/me', [
  authenticateToken,
  upload.single('profile_photo'),
  body('full_name').optional().trim().isLength({ min: 2 }),
  body('bio').optional().trim().isLength({ max: 500 }),
  body('home_location').optional().trim()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  let { full_name, email, phone_number, bio, home_location, languages, interests } = req.body;
  let profilePhoto = req.file ? `/uploads/${req.file.filename}` : req.body.profile_photo;

  // When using form-data, these might come as strings
  if (typeof languages === 'string') { try { languages = JSON.parse(languages); } catch(e) {} }
  if (typeof interests === 'string') { try { interests = JSON.parse(interests); } catch(e) {} }

  if (!full_name && !email && !phone_number && !bio && !profilePhoto && !home_location && !languages && !interests) {
    return res.status(400).json({ error: 'No valid fields to update' });
  }

  try {
    const rows = await db.callProc('sp_update_user_profile', [
      req.user.userId,
      full_name || null,
      email || null,
      phone_number || null,
      bio || null,
      profilePhoto || null,
      home_location || null,
      languages ? JSON.stringify(languages) : null,
      interests ? JSON.stringify(interests) : null
    ]);

    res.json({
      message: 'Profile updated successfully',
      user: rows[0]
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ error: 'Server error updating profile' });
  }
});

// Get user's activities (hosted and RSVPed)
router.get('/me/activities', authenticateToken, async (req, res) => {
  try {
    const hosted = await db.callProc('sp_get_user_hosted_activities', [req.user.userId]);
    const rsvped = await db.callProc('sp_get_user_rsvped_activities', [req.user.userId]);

    res.json({
      hosted,
      attending: rsvped
    });
  } catch (error) {
    console.error('Error fetching user activities:', error);
    res.status(500).json({ error: 'Server error fetching activities' });
  }
});

module.exports = router;
