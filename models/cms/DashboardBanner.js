const mongoose = require('mongoose');

const dashboardBannerSchema = new mongoose.Schema({
    pageId: {
        type: String,
        required: true,
        unique: true,
        index: true
    }, // e.g., 'seller-leads', 'exhibitor-stall', etc.
    title: { type: String },
    subtitle: { type: String },
    imageUrl: { type: String, required: true },
    type: { type: String, enum: ['exhibitor', 'seller'], required: true }
}, { timestamps: true });

module.exports = mongoose.model('DashboardBanner', dashboardBannerSchema);
