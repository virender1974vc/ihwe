const mongoose = require('mongoose');

const expoSupportEnquirySchema = new mongoose.Schema({
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
    mobile: {
        type: String,
        required: true,
        trim: true
    },
    selectedServices: [{
        type: String
    }],
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

module.exports = mongoose.model('ExpoSupportEnquiry', expoSupportEnquirySchema);
