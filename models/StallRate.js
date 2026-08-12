const mongoose = require('mongoose');

const stallRateSchema = new mongoose.Schema({
    eventId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Event', 
        required: true 
    },
    currency: { 
        type: String, 
        enum: ['INR', 'USD'], 
        required: true 
    },
    stallType: { 
        type: String, 
        enum: ['Raw Space', 'Shell Space'], 
        required: true 
    },
    ratePerSqm: {
        type: Number,
        required: true
    },
    plSchemeCharges: [{
        plScheme: {
            type: String,
            enum: ['One Side Open', 'Two Side Open', 'Three Side Open', 'Four Side Open'],
            default: 'One Side Open'
        },
        plcCharges: {
            type: Number,
            default: 0
        }
    }],
    hsnCode: {
        type: String,
        default: ''
    }
}, { timestamps: true });

// Ensure unique rate per event/currency/type combination
stallRateSchema.index({ eventId: 1, currency: 1, stallType: 1 }, { unique: true });

module.exports = mongoose.model('StallRate', stallRateSchema);
