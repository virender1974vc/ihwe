const mongoose = require('mongoose');

const VisionMissionSchema = new mongoose.Schema({
    mission: {
        title: { type: String, default: 'Our Mission' },
        icon: { type: String, default: 'Target' },
        description: { type: String, default: "" },
        highlightText: { type: String, default: 'AYUSH' }
    },
    vision: {
        title: { type: String, default: 'Our Vision' },
        icon: { type: String, default: 'Milestone' },
        description: { type: String, default: "" },
        highlightText: { type: String, default: 'sustainable, healthy future' }
    },
    backgroundColor: { type: String, default: '#23471d' },
    lastUpdated: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('VisionMission', VisionMissionSchema);
