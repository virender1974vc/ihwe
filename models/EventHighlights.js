const mongoose = require('mongoose');

const eventHighlightsSchema = new mongoose.Schema({
    // Header fields
    subtitle: {
        type: String,
        default: 'Mark Your Calendar'
    },
    title: {
        type: String,
        default: 'The Premier Healthcare Event of 2026'
    },
    highlightText: {
        type: String,
        default: 'Healthcare Event'
    },

    // Countdown timer
    countdownDate: {
        type: String,
        default: '2026-08-21'
    },

    // Image
    image: {
        type: String,
        default: ''
    },
    imageAlt: {
        type: String,
        default: 'IHWE 2026'
    },

    // PDF / Brochure
    pdfFile: {
        type: String,
        default: ''
    },
    downloadButtonName: {
        type: String,
        default: 'Download Brochure'
    },

    // Event Date section
    eventDate: {
        type: String,
        default: '21 - 23 August 2026'
    },
    eventDay: {
        type: String,
        default: 'Friday - Sunday'
    },

    // Exhibition Hours section
    exhibitionHours: {
        type: String,
        default: '9:00 AM - 6:00 PM'
    },
    timezone: {
        type: String,
        default: 'Gulf Standard Time (GST)'
    },

    // Venue section
    venueName: {
        type: String,
        default: 'Dubai World Trade Centre'
    },
    venueAddress: {
        type: String,
        default: 'Hall 6, Sheikh Zayed Road, Dubai'
    },

    // Register button
    registerButtonName: {
        type: String,
        default: 'Register as Visitor'
    },
    registerButtonPath: {
        type: String,
        default: '/register'
    },

    isActive: {
        type: Boolean,
        default: true
    }
}, { timestamps: true });

module.exports = mongoose.model('EventHighlights', eventHighlightsSchema);
