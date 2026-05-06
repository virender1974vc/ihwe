const mongoose = require('mongoose');

const msmePmsSchemeSchema = new mongoose.Schema({
    companyName: { type: String, required: true },
    contactPerson: { type: String, required: true },
    mobileNumber: { type: String, required: true },
    emailId: { type: String, required: true },
    udyamNumber: { type: String, required: true },
    gstNumber: { type: String },
    category: { type: String, required: true },
    companyBrief: { type: String, required: true },
    documents: [{
        filename: String,
        path: String,
        mimetype: String
    }],
    status: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('MsmePmsScheme', msmePmsSchemeSchema);
