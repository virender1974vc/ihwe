const mongoose = require('mongoose');

const delegateSessionSchema = new mongoose.Schema({
    dayId: { type: mongoose.Schema.Types.ObjectId, ref: 'DelegateDay', required: true },
    number: { type: String, required: true },
    time: { type: String, required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    isActive: { type: Boolean, default: true },
    displayOrder: { type: Number, default: 0 },
    addedBy: { type: String },
    updatedBy: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('DelegateSession', delegateSessionSchema);
