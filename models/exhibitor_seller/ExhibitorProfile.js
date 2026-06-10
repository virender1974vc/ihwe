const mongoose = require('mongoose');

const ExhibitorProfileSchema = new mongoose.Schema({
    subheading: { type: String, default: 'Show Information' },
    heading: { type: String, default: 'Exhibitor Profile' },
    // Show Information
    eventDate: { type: String, default: '21 - 23 August 2026' },
    eventDay: { type: String, default: 'Friday - Sunday' },
    venueHall: { type: String, default: 'Hall 6, Pragati Maidan' },
    venueCity: { type: String, default: 'New Delhi, India' },
    // Segments (Cards)
    segments: [{
        title: { type: String, required: true },
        accent: { type: String, default: '#23471d' }
    }],
    // Product Categories (List)
    productCategories: [{
        title: { type: String, required: true }
    }]
}, { timestamps: true });

module.exports = mongoose.model('ExhibitorProfile', ExhibitorProfileSchema);
