const mongoose = require('mongoose');

const delegateDaySchema = new mongoose.Schema({
    // Multi-event support: which event's schedule this day belongs to. Nullable —
    // existing/shared days stay visible everywhere until explicitly scoped.
    eventId: { type: mongoose.Schema.Types.ObjectId, default: null },
    date: { type: String, required: true },
    day: { type: String, required: true },
    title: { type: String, required: true },
    isActive: { type: Boolean, default: true },
    displayOrder: { type: Number, default: 0 },
    addedBy: { type: String },
    updatedBy: { type: String }
}, { timestamps: true });
delegateDaySchema.virtual('sessions', {
    ref: 'DelegateSession',
    localField: '_id',
    foreignField: 'dayId'
});

delegateDaySchema.set('toJSON', { virtuals: true });
delegateDaySchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('DelegateDay', delegateDaySchema);
