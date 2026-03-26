const mongoose = require('mongoose');

const supportTicketSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    trim: true,
  },
  type: {
    type: String,
    enum: ['ACCOUNT_SUSPENDED', 'TRANSACTION_BLOCKED', 'OTHER'],
    default: 'ACCOUNT_SUSPENDED',
  },
  message: {
    type: String,
    required: true,
    trim: true,
  },
  metadata: {
    type: Object,
    default: {},
  },
  status: {
    type: String,
    enum: ['open', 'in_progress', 'resolved'],
    default: 'open',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('SupportTicket', supportTicketSchema);
