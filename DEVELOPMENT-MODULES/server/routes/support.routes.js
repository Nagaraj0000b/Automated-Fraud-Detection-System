const express = require('express');
const router = express.Router();
const supportController = require('../controllers/support.controller');
const { verifyToken, requireAdmin } = require('../middleware/auth.middleware');

// Public endpoint so suspended users (no valid token) can contact support
router.post('/contact', supportController.createTicket);

// Admin-only endpoint to list tickets
router.get('/tickets', verifyToken, requireAdmin, supportController.listTickets);

module.exports = router;
