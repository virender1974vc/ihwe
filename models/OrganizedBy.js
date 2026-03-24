const mongoose = require('mongoose');

const OrganizedBySchema = new mongoose.Schema({
    subheading: { type: String, default: 'The Visionaries' },
    heading: { type: String, default: 'Organized By' },
    highlightText: { type: String, default: 'By' },
    badgeText: { type: String, default: 'Non-Profit Organization' },
    orgName: { type: String, default: 'Namo Gange Trust' },
    quote: { type: String, default: 'The Expo is proudly organized by Namo Gange Trust, a non-profit organization working towards the integration of traditional and modern wellness systems for a healthier, more conscious society.' },
    logo: { type: String, default: '' },
    logoAlt: { type: String, default: 'Namo Gange Trust' },
    lastUpdated: { type: Date, default: Date.now }
});

module.exports = mongoose.model('OrganizedBy', OrganizedBySchema);
