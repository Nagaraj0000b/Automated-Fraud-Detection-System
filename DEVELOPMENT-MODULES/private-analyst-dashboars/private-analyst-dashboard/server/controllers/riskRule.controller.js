const RiskRule = require('../models/RiskRule');
const { createAuditLog } = require('./audit.controller');

const ALLOWED_FIELDS = ['amount', 'velocity', 'device', 'location', 'dailyTotal'];
const ALLOWED_OPERATORS = ['>', '<', '==', '!=', '>=', '<='];
const ALLOWED_ACTIONS = ['block', 'flag', 'review'];
const ALLOWED_SEVERITIES = ['Low', 'Medium', 'High', 'Critical'];

const sanitizeRulePayload = (payload = {}) => ({
  name: String(payload.name || '').trim(),
  description: String(payload.description || '').trim(),
  targetField: String(payload.targetField || '').trim(),
  operator: String(payload.operator || '').trim(),
  value: payload.value,
  action: String(payload.action || '').trim().toLowerCase(),
  severity: String(payload.severity || '').trim(),
  isActive: payload.isActive,
});

const validateRulePayload = (payload) => {
  if (!payload.name || payload.name.length < 3) return 'Rule name must be at least 3 characters long';
  if (!payload.description || payload.description.length < 8) return 'Rule description must be at least 8 characters long';
  if (!ALLOWED_FIELDS.includes(payload.targetField)) return 'Invalid target field';
  if (!ALLOWED_OPERATORS.includes(payload.operator)) return 'Invalid operator';
  if (!ALLOWED_ACTIONS.includes(payload.action)) return 'Invalid action';
  if (!ALLOWED_SEVERITIES.includes(payload.severity)) return 'Invalid severity';
  if (payload.value === undefined || payload.value === null || payload.value === '') return 'Threshold value is required';
  if (Number.isNaN(Number(payload.value))) return 'Threshold value must be numeric';
  return '';
};

/**
 * @desc    Get all risk rules
 * @route   GET /api/rules
 * @access  Private (Admin, Analyst)
 */
exports.getAllRules = async (req, res) => {
  try {
    const rules = await RiskRule.find().sort({ severity: -1, createdAt: -1 });
    res.status(200).json({ success: true, count: rules.length, data: rules });
  } catch (error) {
    console.error('Error fetching risk rules:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

/**
 * @desc    Create a new risk rule
 * @route   POST /api/rules
 * @access  Private (Admin, Analyst)
 */
exports.createRule = async (req, res) => {
  try {
    const sanitizedPayload = sanitizeRulePayload(req.body);
    const validationError = validateRulePayload(sanitizedPayload);

    if (validationError) {
      return res.status(400).json({ success: false, message: validationError });
    }

    const newRule = new RiskRule({
      ...sanitizedPayload,
      value: Number(sanitizedPayload.value),
      createdBy: req.user._id
    });

    await newRule.save();

    await createAuditLog({
      user: req.user._id,
      action: 'Risk Rule Created',
      entity: 'RiskRule',
      entityId: newRule._id,
      details: `Created rule: ${newRule.name} (Severity: ${newRule.severity})`,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      result: 'success',
    });

    res.status(201).json({ success: true, data: newRule });
  } catch (error) {
    console.error('Error creating risk rule:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

/**
 * @desc    Update a risk rule (e.g. toggle isActive)
 * @route   PUT /api/rules/:id
 * @access  Private (Admin, Analyst)
 */
exports.updateRule = async (req, res) => {
  try {
    let rule = await RiskRule.findById(req.params.id);

    if (!rule) {
      return res.status(404).json({ success: false, message: 'Rule not found' });
    }

    const sanitizedPayload = sanitizeRulePayload({ ...rule.toObject(), ...req.body });
    const validationError = validateRulePayload(sanitizedPayload);

    if (validationError) {
      return res.status(400).json({ success: false, message: validationError });
    }

    const { isActive } = req.body;
    let auditAction = 'Risk Rule Updated';
    let auditDetails = `Updated rule: ${rule.name}`;

    // Specific audit logging for toggles
    if (isActive !== undefined && isActive !== rule.isActive) {
        auditAction = isActive ? 'Risk Rule Enabled' : 'Risk Rule Disabled';
        auditDetails = `${isActive ? 'Enabled' : 'Disabled'} rule: ${rule.name}`;
    }

    rule = await RiskRule.findByIdAndUpdate(req.params.id, {
      ...req.body,
      ...sanitizedPayload,
      value: Number(sanitizedPayload.value),
    }, {
      new: true,
      runValidators: true,
    });

    await createAuditLog({
      user: req.user._id,
      action: auditAction,
      entity: 'RiskRule',
      entityId: rule._id,
      details: auditDetails,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      result: 'success',
    });

    res.status(200).json({ success: true, data: rule });
  } catch (error) {
    console.error('Error updating risk rule:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

/**
 * @desc    Delete a risk rule
 * @route   DELETE /api/rules/:id
 * @access  Private (Admin)
 */
exports.deleteRule = async (req, res) => {
  try {
    const rule = await RiskRule.findById(req.params.id);

    if (!rule) {
      return res.status(404).json({ success: false, message: 'Rule not found' });
    }

    const ruleName = rule.name;
    const ruleId = rule._id;

    await rule.deleteOne();

    await createAuditLog({
      user: req.user._id,
      action: 'Risk Rule Deleted',
      entity: 'RiskRule',
      entityId: ruleId,
      details: `Deleted rule: ${ruleName}`,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      result: 'success',
    });

    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    console.error('Error deleting risk rule:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};
