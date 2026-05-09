const mongoose = require('mongoose');

const ConferenceTrackSchema = new mongoose.Schema({
    day: { type: String, required: true }, // e.g., "DAY 1"
    date: { type: String, required: true }, // e.g., "21 AUGUST 2026"
    title: { type: String, required: true },
    sessions: [{ type: String }],
    image: { type: String }, // Path to uploaded image
    iconName: { type: String, default: 'Lightbulb' }, // "Lightbulb", "Sprout", "ShieldPlus"
    accentColor: { type: String, default: '#4E9F3D' },
    badgeColor: { type: String, default: 'bg-[#1A4D2E]' },
    shadowColor: { type: String, default: '' },
    link: { type: String },
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('ConferenceTrack', ConferenceTrackSchema);
