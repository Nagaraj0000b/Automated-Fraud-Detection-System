const mongoose = require('mongoose');

const settingSchema = new mongoose.Schema({
  emailNotifications: {
    type: Boolean,
    default: true,
  },
  smsAlerts: {
    type: Boolean,
    default: false,
  },
  maintenanceMode: {
    type: Boolean,
    default: false,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Update the updatedAt field before save
settingSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

const Setting = mongoose.model('Setting', settingSchema);

module.exports = Setting;
