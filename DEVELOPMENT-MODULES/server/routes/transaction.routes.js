const express = require('express');
const router = express.Router();
const transactionController = require('../controllers/transaction.controller');
const authMiddleware = require('../middleware/auth.middleware');

// Protect all transaction routes (Must be logged in)
router.use(authMiddleware.verifyToken);

// Create a new transaction (Simulate Payment)
router.post('/create', transactionController.createTransaction);

// Get my transaction history
router.get('/my-transactions', transactionController.getUserTransactions);

// Raise a dispute
router.post('/:transactionId/dispute', transactionController.raiseDispute);

module.exports = router;
