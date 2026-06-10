const mongoose = require('mongoose');

const WhyAttendSchema = new mongoose.Schema({
    subheading: { type: String, default: 'Why Attend?' },
    heading: { type: String, default: 'Expo Highlights' },
    highlightText: { type: String, default: 'Highlights' },
    cards: [{
        title: { type: String, required: true },
        icon: { type: String, default: 'Globe' },
        desc: { type: String, required: true }
    }],
    lastUpdated: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('WhyAttend', WhyAttendSchema);
