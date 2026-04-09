const express = require('express');
const router = express.Router();
const alertController = require('../controllers/alert.controller');
const authMiddleware = require('../middleware/auth.middleware');

router.use(authMiddleware.verifyToken);
router.use(authMiddleware.checkMaintenanceMode);

router.get('/', alertController.getAlerts);
router.get('/recent', alertController.getRecentAlerts);
router.get('/stats', alertController.getAlertStats);

module.exports = router;
