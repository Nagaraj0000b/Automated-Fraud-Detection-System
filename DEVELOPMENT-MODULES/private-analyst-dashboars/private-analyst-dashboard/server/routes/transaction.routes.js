const express = require('express');
const router = express.Router();
const transactionController = require('../controllers/transactionLive.controller');
const authMiddleware = require('../middleware/auth.middleware');

// Protect all transaction routes (Must be logged in)
router.use(authMiddleware.verifyToken);

// Apply maintenance mode check to all transaction routes
router.use(authMiddleware.checkMaintenanceMode);

// Admin / Analyst Routes
const authorizeAdmin = (req, res, next) => {
  if (['admin', 'analyst', 'auditor'].includes(req.user.role)) {
    next();
  } else {
    res.status(403).json({ success: false, message: 'Not authorized' });
  }
};

// Get all transactions (Admin view)
router.get('/all', authorizeAdmin, transactionController.getAllTransactions);

// Update transaction status (Admin action)
router.patch('/:transactionId/status', authorizeAdmin, transactionController.updateTransactionStatus);

// Create a new transaction (Simulate Payment)
router.post('/create', transactionController.createTransaction);

// Get my transaction history
router.get('/my-transactions', transactionController.getUserTransactions);

// Raise a dispute
router.post('/:transactionId/dispute', transactionController.raiseDispute);

module.exports = router;
