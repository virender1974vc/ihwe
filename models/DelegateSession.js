const mongoose = require('mongoose');

const delegateSessionSchema = new mongoose.Schema({
    // Multi-event support: mirrors the parent DelegateDay's eventId so sessions can be
    // filtered directly without a join. Nullable for backward compatibility.
    eventId: { type: mongoose.Schema.Types.ObjectId, default: null },
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
