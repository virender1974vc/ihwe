const mongoose = require('mongoose');

const exhibitorFeedbackSchema = new mongoose.Schema({
    exhibitorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ExhibitorRegistration',
        required: true,
        index: true
    },
    registrationId: { type: String },
    exhibitorName: { type: String },
    companyName: { type: String },
    stallNumber: { type: String },
    hallNumber: { type: String },
    productCategory: { type: String },
    mobileNumber: { type: String },
    emailId: { type: String },
    responses: { type: mongoose.Schema.Types.Mixed, default: {} },
    status: {
        type: String,
        enum: ['submitted', 'reviewed', 'archived'],
        default: 'submitted'
    },
    reviewedBy: { type: String },
    reviewedAt: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model('ExhibitorFeedback', exhibitorFeedbackSchema);
