const mongoose = require('mongoose');

const upcomingEventSchema = new mongoose.Schema({
    dateString: {
        type: String,
        required: true,
        trim: true,
        // Example: "19 AUG"
    },
    fullDate: {
        type: String,
        required: true,
        trim: true,
        // Example: "19 August 2026"
    },
    time: {
        type: String,
        trim: true,
        default: ""
    },
    title: {
        type: String,
        required: true,
        trim: true
    },
    location: {
        type: String,
        required: true,
        trim: true
    },
    colorClass: {
        type: String,
        required: true,
        default: "text-blue-700 bg-blue-50"
    },
    order: {
        type: Number,
        default: 0
    },
    updatedBy: {
        type: String,
        default: 'System'
    }
}, { timestamps: true });

module.exports = mongoose.model('UpcomingEvent', upcomingEventSchema);
