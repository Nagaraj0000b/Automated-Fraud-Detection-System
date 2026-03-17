const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  accountId: {
    type: String, // Logical account identifier (links to User.accounts.accountId)
    required: false,
  },
  amount: {
    type: Number,
    required: true
  },
  transactionType: {
    type: String,
    enum: ['deposit', 'withdrawal', 'transfer', 'payment'],
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'flagged', 'blocked'], // Fraud status
    default: 'pending'
  },
  recipient: {
    type: String, // Account Number or Merchant Name
    required: true
  },
  disputeStatus: {
    type: String,
    enum: ['none', 'open', 'resolved', 'rejected'],
    default: 'none'
  },
  disputeReason: {
    type: String
  },
  description: {
    type: String
  },
  location: {
    type: String, // e.g., "Mumbai, IN" or lat/long string
  },
  riskScore: {
    type: Number, // 0 to 1 (Fraud Likelihood)
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Transaction = mongoose.model('Transaction', transactionSchema);

module.exports = Transaction;