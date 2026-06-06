const mongoose = require('mongoose');

const UserTargetSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'CrmUser' },
    username: { type: String, required: true, trim: true },
    targetMonth: {
        type: String,
        required: true,
        default: () => new Date().toISOString().slice(0, 7),
        match: /^\d{4}-\d{2}$/
    },
    callTarget: { type: Number, default: 0 },
    whatsappTarget: { type: Number, default: 0 },
    emailTarget: { type: Number, default: 0 },
    meetingTarget: { type: Number, default: 0 },
    revenueTarget: { type: Number, default: 0 },
    status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'CrmUser', default: null },
    createdByFullName: { type: String, default: 'Admin', trim: true },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'CrmUser', default: null },
    updatedByFullName: { type: String, default: 'Admin', trim: true },
}, { timestamps: true });

UserTargetSchema.index({ username: 1, targetMonth: 1 }, { unique: true });

module.exports = mongoose.model('UserTarget', UserTargetSchema);
