const mongoose = require('mongoose');

const reactivationRequestSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  email: {
    type: String,
    required: true
  },
  reason: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'needs_info'],
    default: 'pending'
  },
  adminNotes: {
    type: String
  },
  userResponse: {
    type: String
  },
  messages: [{
    sender: {
      type: String,
      enum: ['user', 'admin'],
      required: true
    },
    text: {
      type: String,
      required: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

reactivationRequestSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

const ReactivationRequest = mongoose.model('ReactivationRequest', reactivationRequestSchema);

module.exports = ReactivationRequest;