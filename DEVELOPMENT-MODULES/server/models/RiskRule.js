const mongoose = require('mongoose');

const riskRuleSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    trim: true,
    default: '',
  },
  // Transaction field this rule inspects
  targetField: {
    type: String,
    enum: ['amount', 'transactionType', 'recipient', 'location', 'description'],
    required: true,
  },
  operator: {
    type: String,
    enum: ['>', '>=', '<', '<=', '==', '!=', 'contains'],
    required: true,
  },
  // Threshold / comparison value. Numeric for 'amount', string otherwise.
  value: {
    type: mongoose.Schema.Types.Mixed,
    required: true,
  },
  action: {
    type: String,
    enum: ['flag', 'block'],
    required: true,
    default: 'flag',
  },
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium',
  },
  enabled: {
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
