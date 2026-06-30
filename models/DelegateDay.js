const mongoose = require('mongoose');

const delegateDaySchema = new mongoose.Schema({
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
