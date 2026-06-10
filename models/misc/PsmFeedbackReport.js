const mongoose = require('mongoose');

const PsmFeedbackReportSchema = new mongoose.Schema({
    exhibitorId: { type: mongoose.Schema.Types.ObjectId, ref: 'ExhibitorRegistration', required: true },
    mseUnitName: String,
    plantAddress: String,
    proprietorName: String,
    mobileNumber: String,
    emailId: String,
    website: String,
    eventDetails: String,
    comments: String,
    visitorCount: String,
    exportInquiries: String,
    businessFinalized: String,
    otherAchievements: String,
    participateAgain: String,
    technologies: [{
        country: String,
        field: String,
        description: String,
        contact: String
    }],
    remarks: String,
    date: String,
    status: { type: String, default: 'draft' }
}, { timestamps: true });

module.exports = mongoose.model('PsmFeedbackReport', PsmFeedbackReportSchema);
