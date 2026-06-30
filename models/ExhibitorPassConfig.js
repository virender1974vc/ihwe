const mongoose = require('mongoose');

const exhibitorPassConfigSchema = new mongoose.Schema({
    passType: {
        type: String,
        enum: ['exhibitor', 'vehicle', 'service', 'visitor', 'lunch', 'water', 'delegate'],
        required: true,
        unique: true
    },
    title: { type: String, required: true },
    subtitle: { type: String, default: '' },
    complimentaryQuota: { type: Number, default: 0, min: 0 },
    totalQuota: { type: Number, default: 0, min: 0 },
    price: { type: Number, default: 0, min: 0 },
    currency: { type: String, default: 'INR' },
    maxPerRequest: { type: Number, default: 10, min: 1 },
    gstPercentage: { type: Number, default: 18, min: 0, max: 100 },
    isActive: { type: Boolean, default: true },
    displayOrder: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('ExhibitorPassConfig', exhibitorPassConfigSchema);
