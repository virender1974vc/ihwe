const mongoose = require('mongoose');

const attendanceDeviceHealthSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
    cameraAvailable: { type: Boolean, default: false },
    cameraPermissionGranted: { type: Boolean, default: false },
    androidVersion: { type: String, default: '' },
    sdkInt: { type: Number, default: null },
    manufacturer: { type: String, default: '' },
    model: { type: String, default: '' },
    apiStatus: { type: String, default: 'unknown' },
    databaseStatus: { type: String, default: 'unknown' },
    roundTripMs: { type: Number, default: null },
    backendLatencyMs: { type: Number, default: null },
    lastSuccessfulScan: { type: Date, default: null },
    lastReportedAt: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('AttendanceDeviceHealth', attendanceDeviceHealthSchema);
