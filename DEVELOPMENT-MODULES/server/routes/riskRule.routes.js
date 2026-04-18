const express = require('express');
const router = express.Router();

// Temporary dummy route to prevent the server from crashing
router.get('/', (req, res) => {
    res.status(200).json({ success: true, message: 'Risk rules API is running' });
});

module.exports = router;