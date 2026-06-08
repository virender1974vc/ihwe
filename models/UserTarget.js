const mongoose = require('mongoose');

const targetSubSchema = new mongoose.Schema({
    callTarget: { type: Number, default: 0 },
    whatsappTarget: { type: Number, default: 0 },
    emailTarget: { type: Number, default: 0 },
    meetingTarget: { type: Number, default: 0 },
    revenueTarget: { type: Number, default: 0 }
}, { _id: false });

const UserTargetSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'CrmUser' },
    username: { type: String, required: true, trim: true },

    daily: { type: targetSubSchema, default: () => ({}) },
    weekly: { type: targetSubSchema, default: () => ({}) },
    monthly: { type: targetSubSchema, default: () => ({}) },
    yearly: { type: targetSubSchema, default: () => ({}) },

    validFrom: { type: Date, default: Date.now },
    validTo: { type: Date, default: null },

    status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'CrmUser', default: null },
    createdByFullName: { type: String, default: 'Admin', trim: true },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'CrmUser', default: null },
    updatedByFullName: { type: String, default: 'Admin', trim: true },
}, { timestamps: true });
UserTargetSchema.index({ username: 1, validTo: 1 });

module.exports = mongoose.model('UserTarget', UserTargetSchema);
