const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key';

// Verify JWT token middleware
exports.verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access token required',
    });
  }

  jwt.verify(token, JWT_SECRET, async (err, decoded) => {
    if (err) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token',
      });
    }

    try {
      // Fetch the latest user data to check status
      const user = await User.findById(decoded.userId || decoded.id);
      
      if (!user) {
         return res.status(401).json({ success: false, message: 'User not found' });
      }

      if (user.status === 'suspended') {
         return res.status(403).json({ 
             success: false, 
             code: 'ACCOUNT_SUSPENDED',
             message: 'Your account has been suspended' 
         });
      }

      // Attach fresh user data to the request
      req.user = {
          ...decoded,
          status: user.status
      };
      
      next();
    } catch (dbError) {
      console.error('Auth middleware DB error:', dbError);
      return res.status(500).json({ success: false, message: 'Server error during authentication' });
    }
  });
};

// Require admin role middleware (must be used after verifyToken)
exports.requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Admin access required',
    });
  }
  next();
};