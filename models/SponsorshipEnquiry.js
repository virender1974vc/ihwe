const mongoose = require('mongoose');

const sponsorshipEnquirySchema = new mongoose.Schema({
    fullName: {
        type: String,
        required: true,
        trim: true
    },
    companyName: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        trim: true
    },
    phone: {
        type: String,
        required: true,
        trim: true
    },
    category: {
        type: String,
        required: true
    },
    message: {
        type: String,
        trim: true
    },
    status: {
        type: String,
        enum: ["new", "pending", "contacted", "resolved"],
        default: "new",
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('SponsorshipEnquiry', sponsorshipEnquirySchema);
