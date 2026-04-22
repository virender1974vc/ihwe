const mongoose = require('mongoose');

const EventOverviewSchema = new mongoose.Schema({
    subtitle: {
        type: String,
        default: 'Event Overview'
    },
    title: {
        type: String,
        default: 'A Global Platform Connecting Healthcare Wellness & Business Opportunities'
    },
    descriptionHtml: {
        type: String,
        default: ''
    },
    keySectorsTitle: {
        type: String,
        default: 'Key Sectors'
    },
    sectors: [{
        label: { type: String, required: true },
        iconName: { type: String, required: true },
        color: { type: String, default: '#3b82f6' }
    }],
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('EventOverview', EventOverviewSchema);
