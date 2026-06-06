const mongoose = require('mongoose');

const UserTargetSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'CrmUser' },
    username: { type: String, required: true, unique: true, trim: true },
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

module.exports = mongoose.model('UserTarget', UserTargetSchema);
