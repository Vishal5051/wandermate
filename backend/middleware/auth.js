const jwt = require('jsonwebtoken');
const db = require('../config/database');

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

const checkVerified = async (req, res, next) => {
  if (!req.user || !req.user.userId) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    const users = await db.query('SELECT phone_verified, email_verified, aadhaar_status FROM users WHERE id = ?', [req.user.userId]);
    
    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = users[0];
    const isIdentityVerified = user.aadhaar_status === 'verified';
    const isContactVerified = user.phone_verified === 1 || user.email_verified === 1;

    if (!isIdentityVerified || !isContactVerified) {
      let missingMsg = 'Verification required: ';
      if (!isIdentityVerified) missingMsg += 'Identity (Aadhaar) ';
      if (!isContactVerified) missingMsg += (missingMsg.length > 23 ? 'and ' : '') + 'Contact (Phone or Email) ';
      
      return res.status(403).json({ 
        error: missingMsg.trim() + ' verification required to host a ride.',
        code: 'VERIFICATION_REQUIRED',
        status: {
          aadhaar: user.aadhaar_status,
          phone: user.phone_verified,
          email: user.email_verified
        }
      });
    }
    next();
  } catch (err) {
    console.error('CheckVerified middleware error:', err);
    res.status(500).json({ error: 'Internal server error during verification check' });
  }
};

const optionalAuth = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token) {
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
      if (!err) {
        req.user = user;
      }
    });
  }
  next();
};

module.exports = { authenticateToken, checkVerified, optionalAuth };
