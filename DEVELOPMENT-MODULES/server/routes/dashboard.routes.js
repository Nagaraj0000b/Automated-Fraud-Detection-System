const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboard.controller');
const { verifyToken } = require('../middleware/auth.middleware');

// All dashboard routes require authentication
router.use(verifyToken);

// GET /api/dashboard/stats        — Aggregate overview statistics
router.get('/stats', dashboardController.getStats);

// GET /api/dashboard/recent-users — Recent user signups for dashboard feed
router.get('/recent-users', dashboardController.getRecentUsers);

module.exports = router;
