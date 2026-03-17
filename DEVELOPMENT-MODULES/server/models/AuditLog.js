const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
    timestamp: {
        type: Date,
        default: Date.now,
        required: true
    },
    action: {
        type: String,
        required: true
    },
    actor: {
        type: String,
        required: true
    },
    target: {
        type: String,
        required: true
    },
    result: {
        type: String,
        required: true,
        enum: ['Success', 'Failed', 'Pending']
    },
    details: {
        type: Object,
        default: {}
    }
});

module.exports = mongoose.model('AuditLog', auditLogSchema);
