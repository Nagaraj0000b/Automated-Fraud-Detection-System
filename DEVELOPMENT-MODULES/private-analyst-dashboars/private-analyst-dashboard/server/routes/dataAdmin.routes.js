const express = require('express');
const dataAdminController = require('../controllers/dataAdmin.controller');
const authMiddleware = require('../middleware/auth.middleware');

const router = express.Router();

router.use(authMiddleware.verifyToken);
router.use(authMiddleware.checkMaintenanceMode);

const authorizeAnalyst = (req, res, next) => {
  if (['admin', 'analyst'].includes(req.user?.role)) {
    return next();
  }
  return res.status(403).json({ success: false, message: 'Not authorized' });
};

// Existing routes
router.post('/restore-latest', authorizeAnalyst, dataAdminController.restoreLatestBackup);
router.delete('/clear', authorizeAnalyst, dataAdminController.clearOperationalData);

// ✅ NAYE — Approve / Block transaction
router.patch('/transactions/:id/approve', authorizeAnalyst, dataAdminController.approveTransaction);
router.patch('/transactions/:id/block',   authorizeAnalyst, dataAdminController.blockTransaction);

module.exports = router;