const mongoose = require('mongoose');

const msmePmsSchemeSchema = new mongoose.Schema({
    exhibitorId: { type: mongoose.Schema.Types.ObjectId, ref: 'ExhibitorRegistration', index: true, sparse: true },
    applicationId: { type: String, unique: true, sparse: true, index: true },
    applicationType: { type: String, enum: ['public_lead', 'exhibitor_claim'], default: 'public_lead', index: true },
    companyName: { type: String, required: true },
    contactPerson: { type: String, required: true },
    mobileNumber: { type: String, required: true },
    emailId: { type: String, required: true },
    udyamNumber: { type: String, required: true },
    gstNumber: { type: String },
    category: { type: String, required: true },
    companyBrief: { type: String, required: true },
    documents: [{
        documentType: String,
        filename: String,
        path: String,
        mimetype: String,
        size: Number,
        uploadedAt: { type: Date, default: Date.now }
    }],
    applicantDetails: { type: mongoose.Schema.Types.Mixed, default: {} },
    bankDetails: { type: mongoose.Schema.Types.Mixed, default: {} },
    selectedExpenses: { type: [String], default: [] },
    declarationAgreed: { type: Boolean, default: false },
    currentStep: { type: Number, min: 1, max: 5, default: 1 },
    completedSteps: { type: [Number], default: [] },
    submittedAt: Date,
    statusHistory: [{
        status: String,
        note: String,
        changedBy: String,
        changedAt: { type: Date, default: Date.now }
    }],
    is_lead: { type: Boolean, default: false },
    status: { type: String, enum: ['Draft', 'Pending', 'Under Review', 'Query Raised', 'Approved', 'Rejected'], default: 'Pending' },
}, { timestamps: true });

msmePmsSchemeSchema.index(
    { exhibitorId: 1, applicationType: 1 },
    { unique: true, partialFilterExpression: { applicationType: 'exhibitor_claim' } }
);

module.exports = mongoose.model('MsmePmsScheme', msmePmsSchemeSchema);
