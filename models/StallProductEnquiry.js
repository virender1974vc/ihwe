const mongoose = require('mongoose');

const stallProductEnquirySchema = new mongoose.Schema({
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'StallProduct',
        required: true,
        index: true,
    },
    exhibitorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ExhibitorRegistration',
        required: true,
    },
    visitorName: { type: String, required: true },
    visitorEmail: { type: String, default: '' },
    visitorPhone: { type: String, default: '' },
    message: { type: String, default: '' },
    source: { type: String, enum: ['visitor', 'buyer', 'web'], default: 'web' },
}, { timestamps: true });

module.exports = mongoose.model('StallProductEnquiry', stallProductEnquirySchema);
