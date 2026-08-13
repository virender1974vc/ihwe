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
    },
    // A stall booking is a service (exhibition space rental), not goods —
    // so invoices classify it under SAC, not HSN. Kept separate from
    // hsnCode so both can be configured if a setup ever needs it.
    sacCode: {
        type: String,
        default: ''
    },
    // Free-text TDS Deduction notes shown on invoices for this rate card —
    // separate lists per payment plan since the terms can differ (e.g. TDS
    // treatment may only need calling out for one of the two). An empty list
    // means no TDS note is shown for that payment plan.
    tdsFullPaymentLines: {
        type: [String],
        default: []
    },
    tdsInstalmentPaymentLines: {
        type: [String],
        default: []
    }
}, { timestamps: true });

// Ensure unique rate per event/currency/type combination
stallRateSchema.index({ eventId: 1, currency: 1, stallType: 1 }, { unique: true });

module.exports = mongoose.model('StallRate', stallRateSchema);
