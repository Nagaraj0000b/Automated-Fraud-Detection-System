const express = require('express');
const router = express.Router();
const auditController = require('../controllers/audit.controller');
const { verifyToken } = require('../middleware/auth.middleware');

// Protect all audit routes
router.use(verifyToken);

/**
 * Role-based access control: Only 'admin' can view audit logs
 */
const authorizeAuditAccess = (req, res, next) => {
  if (['admin'].includes(req.user.role)) {
    next();
  } else {
    res.status(403).json({ success: false, message: 'Not authorized for audit logs' });
  }
};

// GET /api/audit/logs — Retrieve system audit logs
router.get('/logs', authorizeAuditAccess, auditController.getAuditLogs);

module.exports = router;
