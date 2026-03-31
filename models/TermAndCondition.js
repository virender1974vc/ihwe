const mongoose = require('mongoose');

const termAndConditionSchema = new mongoose.Schema({
    eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
    pageName: { 
        type: String, 
        required: true, 
        trim: true 
    },
    title: {
        type: String,
        required: true
    },
    content: { 
        type: String, 
        required: true 
    },
    status: {
        type: String,
        enum: ['Active', 'Inactive'],
        default: 'Active'
    }
}, { timestamps: true });

module.exports = mongoose.model('TermAndCondition', termAndConditionSchema);
