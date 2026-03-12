const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
    logo: {
        type: String,
        default: ""
    },
    emails: [{
        email: String,
        forTopbar: { type: Boolean, default: false },
        forContact: { type: Boolean, default: false }
    }],
    phones: [{
        phone: String,
        forTopbar: { type: Boolean, default: false },
        forContact: { type: Boolean, default: false }
    }],
    addresses: [{
        title: String,
        street: String,
        city: String,
        state: String,
        zipCode: String,
        country: String
    }],
    mapIframe: {
        type: String,
        default: ""
    },
    marqueeText: {
        type: String,
        default: "• 150+ Speakers confirmed • Early Bird discount ending soon! • Join 8,000+ Professionals from 25+ Countries"
    },
    topbarDate: {
        type: String,
        default: "15–17 October 2026"
    }
}, { timestamps: true });

module.exports = mongoose.model('Settings', settingsSchema);
