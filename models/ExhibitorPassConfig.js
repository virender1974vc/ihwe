const mongoose = require('mongoose');
const VehicleTypeAllocationSchema = new mongoose.Schema({
    allocationMode: { type: String, enum: ['fixed', 'perArea'], default: 'fixed' },
    ratioQty: { type: Number, default: 0 },
    ratioArea: { type: Number, default: 9 },
    roundingMode: { type: String, enum: ['floor', 'round', 'ceil'], default: 'floor' },
    complimentaryQuota: { type: Number, default: 0 },
    price: { type: Number, default: 0 },
    hsnCode: { type: String, default: '' },
    gstPercentage: { type: Number, default: 18, min: 0, max: 100 },
}, { _id: false });

const exhibitorPassConfigSchema = new mongoose.Schema({
    // Pass configuration is per-event — each event has its own independent set of pass
    // types, quotas, and pricing (see Event Wise Pass Management). A passType is only
    // unique *within* an event, not across the whole system (compound index below).
    eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true, index: true },
    passType: {
        type: String,
        enum: ['exhibitor', 'vehicle', 'service', 'visitor', 'lunch', 'water', 'delegate'],
        required: true
    },
    title: { type: String, required: true },
    subtitle: { type: String, default: '' },
    complimentaryQuota: { type: Number, default: 0, min: 0 },
    totalQuota: { type: Number, default: 0, min: 0 },
    price: { type: Number, default: 0, min: 0 },
    currency: { type: String, default: 'INR' },
    maxPerRequest: { type: Number, default: 10, min: 1 },
    hsnCode: { type: String, default: '' },
    gstPercentage: { type: Number, default: 18, min: 0, max: 100 },
    isActive: { type: Boolean, default: true },
    displayOrder: { type: Number, default: 0 },
    allocationMode: { type: String, enum: ['fixed', 'perArea'], default: 'fixed' },
    ratioQty: { type: Number, default: 0 },
    ratioArea: { type: Number, default: 9 },
    roundingMode: { type: String, enum: ['floor', 'round', 'ceil'], default: 'floor' },
    validityDays: { type: Number, default: 0 },
    vehicleTypeConfig: {
        twoWheeler: { type: VehicleTypeAllocationSchema, default: () => ({}) },
        fourWheeler: { type: VehicleTypeAllocationSchema, default: () => ({}) },
    }
}, { timestamps: true });

exhibitorPassConfigSchema.index({ eventId: 1, passType: 1 }, { unique: true });

module.exports = mongoose.model('ExhibitorPassConfig', exhibitorPassConfigSchema);
