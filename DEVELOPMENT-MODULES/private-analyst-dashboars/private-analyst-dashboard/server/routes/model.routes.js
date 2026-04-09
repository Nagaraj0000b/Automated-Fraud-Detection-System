const express = require('express');
const router = express.Router();
const modelController = require('../controllers/model.controller');
const { verifyToken, checkMaintenanceMode } = require('../middleware/auth.middleware');

router.use(verifyToken);
router.use(checkMaintenanceMode);

router.get('/', modelController.getModels);
router.post('/:id/train', modelController.trainModel);
router.post('/:id/stop', modelController.stopModel);

module.exports = router;
