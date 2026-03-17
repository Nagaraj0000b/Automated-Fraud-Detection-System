const express = require('express');
const router = express.Router();
const AuditLog = require('../models/AuditLog');
const { verifyToken, requireAdmin } = require('../middleware/auth.middleware');

// @route   GET /api/audit-logs
// @desc    Get all audit logs
// @access  Private/Admin
router.get('/', [verifyToken, requireAdmin], async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 100; // default limit
        const logs = await AuditLog.find().sort({ timestamp: -1 }).limit(limit);
        res.json(logs);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST /api/audit-logs
// @desc    Add a new audit log (Internal use mainly)
// @access  Private/Admin
router.post('/', [verifyToken, requireAdmin], async (req, res) => {
    try {
        const { action, actor, target, result, details } = req.body;

        const newLog = new AuditLog({
            action,
            actor,
            target,
            result,
            details
        });

        const log = await newLog.save();
        res.json(log);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
