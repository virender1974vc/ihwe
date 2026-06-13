const mongoose = require('mongoose');

const exhibitorPassRequestSchema = new mongoose.Schema({
    exhibitorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ExhibitorRegistration',
        required: true
    },
    passType: {
        type: String,
        enum: ['exhibitor', 'vehicle', 'service', 'visitor'],
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
    },
    quantity: {
        type: Number,
        required: true,
        min: 1
    },
    vehicles: [{
        vehicleType: { type: String, enum: ['2-wheeler', '4-wheeler'] },
        vehicleNumber: { type: String, trim: true }
    }],
    personnel: [{
        name: { type: String, trim: true },
        designation: { type: String, trim: true },
        email: { type: String, trim: true, lowercase: true },
        phone: { type: String, trim: true },
        gender: { type: String, enum: ['male', 'female', 'other'] }
    }],
}, { timestamps: true });

module.exports = mongoose.model('ExhibitorPassRequest', exhibitorPassRequestSchema);
