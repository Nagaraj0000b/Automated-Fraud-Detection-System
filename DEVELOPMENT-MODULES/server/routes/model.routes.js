const express = require('express');
const modelController = require('../controllers/model.controller');
const { verifyToken, checkMaintenanceMode } = require('../middleware/auth.middleware');

const router = express.Router();

router.use(verifyToken);
router.use(checkMaintenanceMode);

router.get('/', modelController.getModels);
router.post('/:id/train', modelController.trainModel);
router.post('/:id/stop', modelController.stopModel);

module.exports = router;
