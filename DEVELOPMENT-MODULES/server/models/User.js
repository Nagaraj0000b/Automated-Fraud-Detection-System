const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ['user', 'admin', 'analyst', 'auditor'],
    default: 'user',
  },
  accountBalance: {
    type: Number,
    default: 10000.0, // Default mock balance
  },
  accounts: [
    {
      accountId: {
        type: String,
        required: true,
      },
      bankName: {
        type: String,
        required: true,
        default: 'SecureBank',
      },
      accountNumber: {
        type: String,
        required: true,
      },
      balance: {
        type: Number,
        default: 10000.0,
      },
    },
  ],
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended'],
    default: 'active',
  },
  department: {
    type: String,
    default: 'General',
  },
  lastLogin: {
    type: Date,
    default: null,
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

// Update the updatedAt field before save
userSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

const User = mongoose.model('User', userSchema);

module.exports = User;