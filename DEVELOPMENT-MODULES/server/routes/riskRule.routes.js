const express = require('express');
const router = express.Router();
const riskRuleController = require('../controllers/riskRule.controller');
const { verifyToken } = require('../middleware/auth.middleware');

// Protect all rule routes
router.use(verifyToken);

/**
 * Role-based access control: Only 'admin' or 'analyst' can manage risk rules
 */
const authorizeRules = (req, res, next) => {
  if (['admin', 'analyst'].includes(req.user.role)) {
    next();
  } else {
    res.status(403).json({ success: false, message: 'Not authorized for risk rules' });
  }
};

const authorizeAdminOnly = (req, res, next) => {
  if (req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ success: false, message: 'Admin access required for this action' });
  }
};

router.route('/')
  .get(authorizeRules, riskRuleController.getAllRules)
  .post(authorizeRules, riskRuleController.createRule);

router.route('/:id')
  .put(authorizeRules, riskRuleController.updateRule)
  .delete(authorizeAdminOnly, riskRuleController.deleteRule); // Only admins can hard-delete rules

module.exports = router;
