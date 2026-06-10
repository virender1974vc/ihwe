const mongoose = require('mongoose');

const stallProductSchema = new mongoose.Schema({
    exhibitorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ExhibitorRegistration',
        required: true,
        index: true,
    },
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    category: { type: String, default: '' },
    tags: [{ type: String, trim: true }],
    images: [{ type: String }],
    price: { type: Number, default: 0 },
    priceUnit: { type: String, default: 'per piece' },
    moq: { type: String, default: '' },
    isActive: { type: Boolean, default: true },
    views: { type: Number, default: 0 },
    enquiryCount: { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model('StallProduct', stallProductSchema);
