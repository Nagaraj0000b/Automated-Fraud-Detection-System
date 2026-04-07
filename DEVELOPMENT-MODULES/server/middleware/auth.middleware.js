const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Setting = require('../models/Setting');
const connectDB = require('../config/database');

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key';

// Middleware to check if system is in maintenance mode
exports.checkMaintenanceMode = async (req, res, next) => {
  try {
    const settings = await Setting.findOne();
    
    // If maintenance mode is ON and user is NOT an admin (or not logged in yet)
    if (settings && settings.maintenanceMode) {
      // We check if the user is already attached to req (after verifyToken)
      // or if we should skip this for admin routes specifically.
      // For now, let's just make it a standalone middleware that routes can use.
      
      // If user is logged in, check role
      if (req.user && req.user.role === 'admin') {
        return next();
      }
      
      return res.status(503).json({
        success: false,
        code: 'MAINTENANCE_MODE',
        message: 'System is currently under maintenance. Please try again later.',
      });
    }
    
    next();
  } catch (error) {
    console.error('Maintenance middleware error:', error);
    next(); // Fallback to allowing access if settings check fails
  }
};

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
      if (!connectDB.isConnected()) {
        req.user = {
          ...decoded,
          status: decoded.status || 'active'
        };
        return next();
      }

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
