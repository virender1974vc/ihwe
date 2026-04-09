const mongoose = require('mongoose');

const messageTemplateSchema = new mongoose.Schema({
    formType: {
        type: String,
        required: true,
        unique: true,
        enum: [
            'corporate-visitor',
            'general-visitor',
            'health-camp-visitor',
            'buyer-registration',
            'exhibitor-registration',
            'speaker-nomination',
            'contact-enquiry',
            'career-application',
            'book-meeting'
        ]
    },
    emailSubject: {
        type: String,
        required: true
    },
    emailBody: {
        type: String,
        required: true
    },
    whatsappBody: {
        type: String,
        required: true
    },
    lastUpdatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, { timestamps: true });

module.exports = mongoose.model('MessageTemplate', messageTemplateSchema);
