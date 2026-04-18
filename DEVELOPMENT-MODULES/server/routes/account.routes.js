const express = require('express');
const router = express.Router();
const accountController = require('../controllers/account.controller');
const { verifyToken, checkMaintenanceMode } = require('../middleware/auth.middleware');

// All account routes require authentication
router.use(verifyToken);

// Apply maintenance mode check to all account routes
router.use(checkMaintenanceMode);

// GET /api/accounts/my-accounts - list logged-in user's accounts
router.get('/my-accounts', accountController.getMyAccounts);

// POST /api/accounts - create a new account for the logged-in user
router.post('/', accountController.addAccount);

// POST /api/accounts/add-money - add money to a specific account
router.post('/add-money', accountController.addMoney);

module.exports = router;
