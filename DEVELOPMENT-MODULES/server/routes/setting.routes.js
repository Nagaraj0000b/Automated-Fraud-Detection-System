const express = require('express');
const router = express.Router();
const settingController = require('../controllers/setting.controller');
const { verifyToken } = require('../middleware/auth.middleware');

// Protect all settings routes
router.use(verifyToken);

/**
 * Role-based access control: Only 'admin' can manage system settings
 */
const authorizeAdmin = (req, res, next) => {
  if (req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ success: false, message: 'Not authorized for system settings' });
  }
};

// GET /api/settings - Retrieve global settings
router.get('/', authorizeAdmin, settingController.getSettings);

// PUT /api/settings - Update global settings
router.put('/', authorizeAdmin, settingController.updateSettings);

module.exports = router;
