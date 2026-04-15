const express = require('express');
const db = require('../config/database');
const { authenticateToken, optionalAuth } = require('../middleware/auth');

const router = express.Router();

// Get recommendations near location
router.get('/nearby', optionalAuth, async (req, res) => {
  const { lat, lng, radius = 5000, category } = req.query;

  if (!lat || !lng) {
    return res.status(400).json({ error: 'Latitude and longitude required' });
  }

  try {
    const rows = await db.callProc('sp_get_nearby_recommendations', [
      parseFloat(lat), parseFloat(lng), parseInt(radius),
      category || null
    ]);

    res.json({
      recommendations: rows,
      count: rows.length
    });
  } catch (error) {
    console.error('Error fetching recommendations:', error);
    res.status(500).json({ error: 'Server error fetching recommendations' });
  }
});

// Get single recommendation details
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const rows = await db.callProc('sp_get_recommendation_by_id', [parseInt(req.params.id)]);

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Recommendation not found' });
    }

    res.json({ recommendation: rows[0] });
  } catch (error) {
    console.error('Error fetching recommendation:', error);
    res.status(500).json({ error: 'Server error fetching recommendation' });
  }
});

module.exports = router;
