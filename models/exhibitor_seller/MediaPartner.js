const mongoose = require('mongoose');

const mediaPartnerSchema = new mongoose.Schema({
    name: { type: String, required: true },
    category: { type: String, default: 'MEDIA PARTNER' },
    logo: { type: String, required: true },
    link: { type: String },
    isActive: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
    updatedBy: { type: String }
}, { timestamps: true });



module.exports = mongoose.model('MediaPartner', mediaPartnerSchema);
