const mongoose = require('mongoose');

const ePromotionPackageSchema = new mongoose.Schema({
    title: { type: String, required: true },
    subtitle: { type: String },
    price: { type: Number, required: true },
    gstText: { type: String, default: '+18% GST' },
    features: [{ type: String }],
    backgroundImage: { type: String },
    buttonText: { type: String },
    badgeText: { type: String },
    borderColor: { type: String },
    textColor: { type: String },
    priceColor: { type: String },
    isActive: { type: Boolean, default: true },
    order: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('EPromotionPackage', ePromotionPackageSchema);
