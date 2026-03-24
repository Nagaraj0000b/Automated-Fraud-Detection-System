const RiskRule = require('../models/RiskRule');
const { createAuditLog } = require('./audit.controller');

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
    const newRule = new RiskRule({
      ...req.body,
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

    const { isActive, ...updateData } = req.body;
    let auditAction = 'Risk Rule Updated';
    let auditDetails = `Updated rule: ${rule.name}`;

    // Specific audit logging for toggles
    if (isActive !== undefined && isActive !== rule.isActive) {
        auditAction = isActive ? 'Risk Rule Enabled' : 'Risk Rule Disabled';
        auditDetails = `${isActive ? 'Enabled' : 'Disabled'} rule: ${rule.name}`;
    }

    rule = await RiskRule.findByIdAndUpdate(req.params.id, req.body, {
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
