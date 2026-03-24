const Setting = require('../models/Setting');
const { createAuditLog } = require('./audit.controller');

/**
 * @desc    Get system settings (Singleton approach)
 * @route   GET /api/settings
 * @access  Private (Admin only)
 */
exports.getSettings = async (req, res) => {
  try {
    let settings = await Setting.findOne();
    
    // If no settings exist yet, create default
    if (!settings) {
      settings = new Setting();
      await settings.save();
    }

    res.status(200).json({
      success: true,
      data: settings,
    });
  } catch (error) {
    console.error('Error fetching system settings:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error fetching settings',
    });
  }
};

/**
 * @desc    Update system settings
 * @route   PUT /api/settings
 * @access  Private (Admin only)
 */
exports.updateSettings = async (req, res) => {
  try {
    const { emailNotifications, smsAlerts, maintenanceMode } = req.body;
    
    let settings = await Setting.findOne();
    if (!settings) {
      settings = new Setting();
    }

    // Update fields
    if (emailNotifications !== undefined) settings.emailNotifications = emailNotifications;
    if (smsAlerts !== undefined) settings.smsAlerts = smsAlerts;
    if (maintenanceMode !== undefined) settings.maintenanceMode = maintenanceMode;

    await settings.save();

    // Create Audit Log
    await createAuditLog({
      user: req.user._id,
      action: 'System Settings Updated',
      entity: 'System',
      entityId: settings._id,
      details: 'Admin updated global system configurations',
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      result: 'success',
    });

    res.status(200).json({
      success: true,
      data: settings,
    });
  } catch (error) {
    console.error('Error updating system settings:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error updating settings',
    });
  }
};
