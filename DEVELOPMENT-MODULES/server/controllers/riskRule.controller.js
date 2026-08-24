const RiskRule = require('../models/RiskRule');
const { createAuditLog } = require('./audit.controller');

const logAudit = async (req, action, ruleName, details, result = 'Success') => {
  await createAuditLog({
    action,
    actor: req.user?.userId || 'system',
    actorName: req.user?.name || 'Admin',
    target: `RiskRule: ${ruleName}`,
    ipAddress: req.ip,
    details,
    result,
  });
};

/**
 * @desc    List all risk rules
 * @route   GET /api/rules
 * @access  Private (Admin only)
 */
exports.getRules = async (req, res) => {
  try {
    const rules = await RiskRule.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: rules.length, rules });
  } catch (error) {
    console.error('Error fetching risk rules:', error);
    res.status(500).json({ success: false, message: 'Server error fetching risk rules' });
  }
};

/**
 * @desc    Create a new risk rule
 * @route   POST /api/rules
 * @access  Private (Admin only)
 */
exports.createRule = async (req, res) => {
  try {
    const { name, description, targetField, operator, value, action, severity, enabled } = req.body;

    if (!name || !targetField || !operator || value === undefined || value === null || value === '') {
      return res.status(400).json({ success: false, message: 'name, targetField, operator and value are required' });
    }

    const rule = new RiskRule({
      name,
      description,
      targetField,
      operator,
      value,
      action: action || 'flag',
      severity: severity || 'medium',
      enabled: enabled === undefined ? true : enabled,
      createdBy: req.user?.userId,
    });

    await rule.save();
    await logAudit(req, 'Risk Rule Created', rule.name, { targetField, operator, value, action: rule.action, severity: rule.severity });

    res.status(201).json({ success: true, rule });
  } catch (error) {
    if (error && error.name === 'ValidationError') {
      return res.status(400).json({ success: false, message: error.message });
    }
    console.error('Error creating risk rule:', error);
    res.status(500).json({ success: false, message: 'Server error creating risk rule' });
  }
};

/**
 * @desc    Update a risk rule (fields or enabled toggle)
 * @route   PUT /api/rules/:id
 * @access  Private (Admin only)
 */
exports.updateRule = async (req, res) => {
  try {
    const rule = await RiskRule.findById(req.params.id);
    if (!rule) {
      return res.status(404).json({ success: false, message: 'Risk rule not found' });
    }

    const { name, description, targetField, operator, value, action, severity, enabled } = req.body;
    if (name !== undefined) rule.name = name;
    if (description !== undefined) rule.description = description;
    if (targetField !== undefined) rule.targetField = targetField;
    if (operator !== undefined) rule.operator = operator;
    if (value !== undefined) rule.value = value;
    if (action !== undefined) rule.action = action;
    if (severity !== undefined) rule.severity = severity;
    if (enabled !== undefined) rule.enabled = enabled;

    await rule.save();
    await logAudit(req, enabled !== undefined && Object.keys(req.body).length === 1
      ? (enabled ? 'Risk Rule Enabled' : 'Risk Rule Disabled')
      : 'Risk Rule Updated', rule.name, req.body);

    res.status(200).json({ success: true, rule });
  } catch (error) {
    if (error && error.name === 'ValidationError') {
      return res.status(400).json({ success: false, message: error.message });
    }
    console.error('Error updating risk rule:', error);
    res.status(500).json({ success: false, message: 'Server error updating risk rule' });
  }
};

/**
 * @desc    Delete a risk rule
 * @route   DELETE /api/rules/:id
 * @access  Private (Admin only)
 */
exports.deleteRule = async (req, res) => {
  try {
    const rule = await RiskRule.findById(req.params.id);
    if (!rule) {
      return res.status(404).json({ success: false, message: 'Risk rule not found' });
    }

    await rule.deleteOne();
    await logAudit(req, 'Risk Rule Deleted', rule.name, { targetField: rule.targetField, operator: rule.operator, value: rule.value });

    res.status(200).json({ success: true, message: 'Risk rule deleted' });
  } catch (error) {
    console.error('Error deleting risk rule:', error);
    res.status(500).json({ success: false, message: 'Server error deleting risk rule' });
  }
};
