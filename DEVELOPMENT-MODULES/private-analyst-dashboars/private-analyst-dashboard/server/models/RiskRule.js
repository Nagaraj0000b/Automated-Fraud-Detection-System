const mongoose = require('mongoose');

const riskRuleSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    required: true,
  },
  // The field on the transaction to evaluate
  targetField: {
    type: String,
    required: true,
    enum: ['amount', 'velocity', 'device', 'location', 'dailyTotal'],
    default: 'amount'
  },
  // The comparison operator
  operator: {
    type: String,
    required: true,
    enum: ['>', '<', '==', '!=', '>=', '<='],
    default: '>'
  },
  // The threshold value
  value: {
    type: mongoose.Schema.Types.Mixed,
    required: true,
  },
  // What to do if the rule triggers
  action: {
    type: String,
    required: true,
    enum: ['block', 'flag', 'review'],
    default: 'flag'
  },
  // Severity for UI grouping and alerts
  severity: {
    type: String,
    enum: ['Low', 'Medium', 'High', 'Critical'],
    default: 'Medium',
  },
  // Toggle switch
  isActive: {
    type: Boolean,
    default: true,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

riskRuleSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

const RiskRule = mongoose.model('RiskRule', riskRuleSchema);

module.exports = RiskRule;
