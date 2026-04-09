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

router.post('/restore-latest', authorizeAnalyst, dataAdminController.restoreLatestBackup);
router.delete('/clear', authorizeAnalyst, dataAdminController.clearOperationalData);

module.exports = router;
