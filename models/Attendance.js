const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
    eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', default: null, index: true },
    eventDay: { type: String, required: true, match: /^\d{4}-\d{2}-\d{2}$/, index: true },
    subjectKey: { type: String, required: true, trim: true, index: true },
    subjectId: { type: String, required: true, trim: true },
    companyId: { type: String, default: '', trim: true, index: true },
    subjectType: {
        type: String,
        required: true,
        enum: ['visitor', 'buyer', 'exhibitor'],
        index: true
    },
    subjectSubType: { type: String, required: true, trim: true },
    attendanceKind: { type: String, enum: ['registration', 'pass'], default: 'registration', index: true },
    passType: { type: String, default: '', trim: true, index: true },
    registrationId: { type: String, required: true, trim: true, index: true },
    name: { type: String, default: '' },
    company: { type: String, default: '' },
    email: { type: String, default: '' },
    mobile: { type: String, default: '' },
    designation: { type: String, default: '' },
    photoUrl: { type: String, default: '' },
    photoKind: { type: String, enum: ['person', 'logo'], default: 'person' },
    markedAt: { type: Date, default: Date.now },
    markedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    markedByName: { type: String, default: '' },
    source: { type: String, enum: ['qr', 'manual'], default: 'qr' },
    gate: { type: String, default: '' },
    rawQr: { type: String, default: '' },
    allocatedQuantity: { type: Number, min: 0, default: 1 },
    deliveredQuantity: { type: Number, min: 0, default: 1 },
    deliveryHistory: [{
        quantity: { type: Number, min: 1 },
        deliveredAt: { type: Date, default: Date.now },
        deliveredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        deliveredByName: { type: String, default: '' },
        acknowledgementStatus: {
            type: String,
            enum: ['pending', 'confirmed', 'disputed'],
            default: 'pending'
        },
        acknowledgedAt: { type: Date, default: null },
        acknowledgementNote: { type: String, default: '', trim: true }
    }],
    acknowledgementStatus: {
        type: String,
        enum: ['pending', 'confirmed', 'disputed'],
        default: 'pending',
        index: true
    },
    acknowledgedAt: { type: Date, default: null },
    acknowledgementNote: { type: String, default: '', trim: true },
}, { timestamps: true });

attendanceSchema.index(
    { eventId: 1, eventDay: 1, subjectKey: 1 },
    { unique: true, name: 'unique_attendance_per_event_day' }
);

module.exports = mongoose.model('Attendance', attendanceSchema);
