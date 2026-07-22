const mongoose = require('mongoose');

const scanAttemptSchema = new mongoose.Schema({
  eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', index: true },
  registrationId: { type: String, default: '', index: true },
  subjectKey: { type: String, default: '', index: true },
  subjectType: { type: String, default: '', index: true },
  result: { type: String, enum: ['resolved', 'marked', 'duplicate', 'invalid'], required: true, index: true },
  source: { type: String, enum: ['qr', 'manual'], default: 'qr' },
  attemptedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  attemptedByName: { type: String, default: '' },
  detail: { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('AttendanceScanAttempt', scanAttemptSchema);
