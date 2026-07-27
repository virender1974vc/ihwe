const mongoose = require('mongoose');

const roleSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    description: {
        type: String,
        default: ''
    },
    permissions: {
        type: Object,
        default: {}
    },
    status: {
        type: String,
        enum: ['Active', 'Inactive'],
        default: 'Active'
    },
    createdBy: {
        type: String,
        default: 'System'
    },
    updatedBy: {
        type: String,
        default: 'System'
    }
}, { timestamps: true });

module.exports = mongoose.model('Role', roleSchema);
