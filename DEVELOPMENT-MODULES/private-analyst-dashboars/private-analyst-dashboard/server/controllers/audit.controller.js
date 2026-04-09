const AuditLog = require('../models/AuditLog');

/**
 * @desc    Get all audit/compliance logs
 * @route   GET /api/audit/logs
 * @access  Private (Admin/Auditor only)
 */
exports.getAuditLogs = async (req, res) => {
  try {
    const { limit = 50, page = 1, action, result } = req.query;
    
    // Build filter
    const query = {};
    if (action) query.action = action;
    if (result) query.result = result;

    const logs = await AuditLog.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await AuditLog.countDocuments(query);

    res.status(200).json({
      success: true,
      count: logs.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      logs,
    });
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error fetching audit logs',
    });
  }
};

/**
 * @desc    Create a new audit log (Internal use)
 */
exports.createAuditLog = async (data) => {
  try {
    const log = new AuditLog(data);
    await log.save();
    return log;
  } catch (error) {
    console.error('Error creating audit log:', error);
  }
};
