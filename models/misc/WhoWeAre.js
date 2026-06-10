const mongoose = require('mongoose');

const WhoWeAreSchema = new mongoose.Schema({
    subheading: {
        type: String,
        default: 'Who We Are'
    },
    title: {
        type: String,
        default: 'A Decade of Global Healthcare Leadership'
    },
    highlightText: {
        type: String,
        default: 'Healthcare Leadership'
    },
    description: {
        type: String,
        required: true
    },
    points: {
        type: [String],
        default: ['', '', '', '', '']
    },
    images: [{
        url: { type: String, default: '' },
        altText: { type: String, default: '' }
    }],
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('WhoWeAre', WhoWeAreSchema);
