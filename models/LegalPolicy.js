const mongoose = require('mongoose');

const legalPolicySchema = new mongoose.Schema({
    page: { 
        type: String, 
        required: true, 
        unique: true,
        enum: ['privacy-policy', 'terms-of-service'],
        trim: true 
    },
    title: {
        type: String,
        required: true
    },
    content: { 
        type: String, 
        required: true 
    },
}, { timestamps: true });

module.exports = mongoose.model('LegalPolicy', legalPolicySchema);
