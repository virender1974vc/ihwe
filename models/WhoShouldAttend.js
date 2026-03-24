const mongoose = require('mongoose');

const WhoShouldAttendSchema = new mongoose.Schema({
    subheading: { type: String, default: 'Target Audience' },
    heading: { type: String, default: 'Who Should Attend?' },
    highlightText: { type: String, default: 'Attend?' },
    image: { type: String, default: '/images/who2.png' },
    imageAlt: { type: String, default: 'Expo Attendees' },
    groups: [{ type: String }],
    lastUpdated: { type: Date, default: Date.now }
});

module.exports = mongoose.model('WhoShouldAttend', WhoShouldAttendSchema);
