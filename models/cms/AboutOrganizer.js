const mongoose = require('mongoose');

const AboutOrganizerSchema = new mongoose.Schema({
    subtitle: {
        type: String,
        default: 'ABOUT THE ORGANIZER'
    },
    title: {
        type: String,
        default: 'Namo Gange Wellness Pvt. Ltd.'
    },
    descriptionHtml: {
        type: String,
        default: ''
    },
    capabilitiesTitle: {
        type: String,
        default: 'CORE CAPABILITIES'
    },
    capabilities: {
        type: [String],
        default: [
            "International exhibitions & trade shows",
            "Healthcare conferences & seminars",
            "Buyer–Seller Meets (B2B matchmaking)",
            "Sponsorship & brand partnerships",
            "International collaborations & delegations",
            "Focused on delivering measurable ROI and business growth for participants."
        ]
    },
    imageUrl: {
        type: String,
        default: ''
    },
    imageAltText: {
        type: String,
        default: 'Organizer Image'
    },
    experienceText: {
        type: String,
        default: '10+ Years'
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('AboutOrganizer', AboutOrganizerSchema);
