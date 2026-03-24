const mongoose = require('mongoose');

const socialMediaSchema = new mongoose.Schema({
    facebook: { type: String, default: "" },
    instagram: { type: String, default: "" },
    twitter: { type: String, default: "" },
    linkedin: { type: String, default: "" },
    youtube: { type: String, default: "" },
    whatsappNumber: { type: String, default: "" },
    whatsappMessage: { type: String, default: "" },
    callNumber: { type: String, default: "" }
}, { timestamps: true });

module.exports = mongoose.model('SocialMedia', socialMediaSchema);
