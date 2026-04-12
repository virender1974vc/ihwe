const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
    name: { 
        type: String, 
        required: true, 
        trim: true,
        unique: true
    },
    startDate: Date,
    endDate: Date,
    location: String,
    onlineAdvancePercentage: { 
        type: Number, 
        default: 50 
    },
    manualAdvancePercentage: { 
        type: Number, 
        default: 50 
    },
    status: { 
        type: String, 
        enum: ['active', 'inactive'], 
        default: 'active' 
    },
    ticketsStatus: {
        type: String,
        default: 'Few Remaining'
    },
    speakersCount: {
        type: String,
        default: '100+'
    },
    description: {
        type: String,
        default: ''
    },
    contactPhone: {
        type: String,
        default: ''
    },
    order: {
        type: Number,
        default: 0
    }
}, { timestamps: true });

module.exports = mongoose.model('Event', eventSchema);
