const mongoose = require('mongoose');

const analyticsSchema = new mongoose.Schema({
    iconName: {
        type: String,
        required: true,
        trim: true
    },
    ipAddress: {
        type: String,
        required: true
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Analytics', analyticsSchema);
