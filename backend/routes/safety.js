const express = require('express');
const { body, validationResult } = require('express-validator');
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = express.Router();

// Get Aadhaar verification status
router.get('/aadhaar-status', authenticateToken, async (req, res) => {
  try {
    const rows = await db.callProc('sp_get_user_profile', [req.user.userId]);
    if (rows.length === 0) return res.status(404).json({ error: 'User not found' });
    
    res.json({
      status: rows[0].aadhaar_status,
      masked_number: rows[0].aadhaar_number_masked
    });
  } catch (error) {
    res.status(500).json({ error: 'Error fetching Aadhaar status' });
  }
});

// Submit Aadhaar verification
router.post('/verify-aadhaar', [
  authenticateToken,
  upload.single('aadhaar_image'),
  body('aadhaar_number').isLength({ min: 12, max: 12 }).withMessage('Aadhaar number must be 12 digits')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  if (!req.file) return res.status(400).json({ error: 'Aadhaar image is required' });

  try {
    const { aadhaar_number } = req.body;
    // Masking number: **** **** 1234
    const masked = `**** **** ${aadhaar_number.slice(-4)}`;
    const photoUrl = `/uploads/${req.file.filename}`;

    await db.callProc('sp_submit_aadhaar_verification', [
      req.user.userId,
      masked,
      photoUrl
    ]);

    res.json({ message: 'Verification submitted for review' });
  } catch (error) {
    console.error('Aadhaar submission error:', error);
    res.status(500).json({ error: 'Failed to submit verification' });
  }
});

// Get emergency contacts
router.get('/contacts', authenticateToken, async (req, res) => {
  try {
    const contacts = await db.callProc('sp_manage_emergency_contact', ['GET', req.user.userId, null, null, null, null]);
    res.json({ contacts });
  } catch (error) {
    res.status(500).json({ error: 'Error fetching contacts' });
  }
});

// Add emergency contact
router.post('/contacts', [
  authenticateToken,
  body('name').notEmpty(),
  body('relationship').notEmpty(),
  body('phone').notEmpty()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const { name, relationship, phone } = req.body;
    const contacts = await db.callProc('sp_manage_emergency_contact', [
      'ADD', req.user.userId, null, name, relationship, phone
    ]);
    res.json({ message: 'Contact added', contacts });
  } catch (error) {
    res.status(500).json({ error: 'Error adding contact' });
  }
});

// Delete emergency contact
router.delete('/contacts/:id', authenticateToken, async (req, res) => {
  try {
    const contacts = await db.callProc('sp_manage_emergency_contact', [
      'DELETE', req.user.userId, parseInt(req.params.id), null, null, null
    ]);
    res.json({ message: 'Contact deleted', contacts });
  } catch (error) {
    res.status(500).json({ error: 'Error deleting contact' });
  }
});

// Trigger SOS
router.post('/sos', [
  authenticateToken,
  body('latitude').isFloat(),
  body('longitude').isFloat()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const { latitude, longitude } = req.body;
    await db.callProc('sp_trigger_sos', [req.user.userId, latitude, longitude]);
    
    // In a real app, this would trigger SMS/Push to emergency contacts
    console.log(`[SOS ALERT] User ${req.user.userId} at ${latitude}, ${longitude}`);
    
    res.json({ message: 'Emergency alert triggered. Stay calm, help is on the way.' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to trigger SOS' });
  }
});

// Add a review
router.post('/review', [
  authenticateToken,
  body('user_id').isInt(),
  body('rating').isInt({ min: 1, max: 5 }),
  body('comment').optional().isString()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const { user_id, rating, comment } = req.body;
    if (user_id === req.user.userId) return res.status(400).json({ error: 'Cannot review yourself' });

    await db.callProc('sp_add_user_review', [user_id, req.user.userId, rating, comment]);
    res.json({ message: 'Review added successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Error adding review' });
  }
});

module.exports = router;
