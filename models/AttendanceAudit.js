const mongoose = require('mongoose');

const attendanceAuditSchema = new mongoose.Schema({
  eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', index: true },
  attendanceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Attendance', index: true },
  subjectKey: { type: String, default: '', index: true },
  registrationId: { type: String, default: '', index: true },
  action: { type: String, enum: ['created', 'corrected', 'removed', 'duplicate-scan', 'acknowledged', 'disputed'], required: true, index: true },
  reason: { type: String, default: '' },
  before: { type: mongoose.Schema.Types.Mixed, default: null },
  after: { type: mongoose.Schema.Types.Mixed, default: null },
  performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  performedByName: { type: String, default: '' },
  performedByRole: { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('AttendanceAudit', attendanceAuditSchema);
