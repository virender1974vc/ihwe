const mongoose = require('mongoose');

const internationalExhibitorConfigSchema = new mongoose.Schema({
    packages: [{
        name: { type: String, required: true },
        price: { type: Number, required: true }, // In USD
        features: [String],
        category: { type: String, enum: ['Standard', 'Premium', 'VIP'], default: 'Standard' },
        isMembership: { type: Boolean, default: false }
    }],
    active: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('InternationalExhibitorConfig', internationalExhibitorConfigSchema);
