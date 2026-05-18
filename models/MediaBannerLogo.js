const mongoose = require('mongoose');

const mediaBannerLogoSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    logo: {
        type: String,
        required: true
    },
    order: {
        type: Number,
        default: 0
    },
    isActive: {
        type: Boolean,
        default: true
    },
    updatedBy: String
}, { timestamps: true });

module.exports = mongoose.model('MediaBannerLogo', mediaBannerLogoSchema);
