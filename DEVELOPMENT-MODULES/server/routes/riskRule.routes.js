const express = require('express');
const router = express.Router();
const riskRuleController = require('../controllers/riskRule.controller');
const { verifyToken, requireAdmin } = require('../middleware/auth.middleware');

// All risk rule management routes are admin-only
router.use(verifyToken, requireAdmin);

// GET /api/rules - list all risk rules
router.get('/', riskRuleController.getRules);

// POST /api/rules - create a new risk rule
router.post('/', riskRuleController.createRule);

// PUT /api/rules/:id - update a risk rule (including enable/disable toggle)
router.put('/:id', riskRuleController.updateRule);

// DELETE /api/rules/:id - delete a risk rule
router.delete('/:id', riskRuleController.deleteRule);

module.exports = router;
