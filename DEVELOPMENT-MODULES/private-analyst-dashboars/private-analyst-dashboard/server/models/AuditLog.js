const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  action: {
    type: String,
    required: true,
    trim: true,
  },
  actor: {
    type: mongoose.Schema.Types.Mixed, // Can be a User ID or 'system'
    required: true,
  },
  actorName: {
    type: String,
    required: true,
  },
  target: {
    type: String, // ID or name of the entity being acted upon
    required: true,
  },
  details: {
    type: mongoose.Schema.Types.Mixed, // Additional information about the action
    default: {},
  },
  result: {
    type: String,
    enum: ['Success', 'Failure', 'Warning'],
    default: 'Success',
  },
  ipAddress: {
    type: String,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const AuditLog = mongoose.model('AuditLog', auditLogSchema);

module.exports = AuditLog;
