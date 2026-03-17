const express = require('express');
const router = express.Router();
const accountController = require('../controllers/account.controller');
const { verifyToken } = require('../middleware/auth.middleware');

// All account routes require authentication
router.use(verifyToken);

// GET /api/accounts/my-accounts - list logged-in user's accounts
router.get('/my-accounts', accountController.getMyAccounts);

// POST /api/accounts - create a new account for the logged-in user
router.post('/', accountController.addAccount);

module.exports = router;
