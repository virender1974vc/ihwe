const mongoose = require('mongoose');

const PartnerSchema = new mongoose.Schema({
    name: { type: String, default: '' },
    logo: { type: String, required: true },
    imageAlt: { type: String, default: '' },
    order: { type: Number, default: 0 }
});

const PartnerGroupSchema = new mongoose.Schema({
    subheading: { type: String, default: 'Title Partners' },
    heading: { type: String, default: 'Industry Leadership' },
    highlightText: { type: String, default: 'Leadership' },
    partners: [PartnerSchema],
    order: { type: Number, default: 0 },
    updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('PartnerGroup', PartnerGroupSchema);
