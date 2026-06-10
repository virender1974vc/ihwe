const mongoose = require('mongoose');

const stallSchema = new mongoose.Schema({
    eventId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Event', 
        required: true 
    },
    stallNumber: { 
        type: String, 
        required: true, 
        trim: true
    },
    length: { 
        type: Number, 
        required: true,
        default: 3
    },
    width: { 
        type: Number, 
        required: true,
        default: 3
    },
    area: { 
        type: Number, 
        required: true 
    },
    plScheme: {
        type: String, 
        enum: ['One Side Open', 'Two Side Open', 'Three Side Open', 'Four Side Open'],
        default: 'One Side Open'
    },
    incrementPercentage: { 
        type: Number, 
        default: 0 
    },
    discountPercentage: { 
        type: Number, 
        default: 0 
    },
    status: { 
        type: String, 
        enum: ['available', 'booked', 'reserved'], 
        default: 'available' 
    },
    bookedBy: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'ExhibitorRegistration', 
        default: null 
    }
}, { timestamps: true });

stallSchema.index({ eventId: 1, stallNumber: 1 }, { unique: true });

module.exports = mongoose.model('Stall', stallSchema);
