const mongoose = require('mongoose');

const contactEnquirySchema = new mongoose.Schema({
    name: {
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
    service: {
        type: String,
        required: false
    },
    organization: {
        type: String,
        trim: true
    },
    source: {
        type: String,
        default: 'Contact Page'
    },
    message: {
        type: String,
        required: true
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

module.exports = mongoose.model('ContactEnquiry', contactEnquirySchema);
