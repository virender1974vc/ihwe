const mongoose = require('mongoose');

const ServiceDetailSchema = new mongoose.Schema({
    serviceCardId: { 
        type: mongoose.Schema.Types.ObjectId, 
        required: true,
        unique: true // One detail page per service card
    },
    serviceTitle: { type: String, required: true }, // Store for easier listing
    slug: { type: String, sparse: true }, // Not strictly required, will fallback to ID
    heroImage: { type: String, default: '' },
    heroImageAlt: { type: String, default: '' },
    heroOverlayOpacity: { type: Number, default: 0.7 },
    h1Heading: { type: String, required: true },
    content: { type: String, default: '' },
    updatedBy: { type: String, default: 'System' }
}, { timestamps: true });

module.exports = mongoose.model('ServiceDetail', ServiceDetailSchema);
