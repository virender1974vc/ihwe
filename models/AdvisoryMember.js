const mongoose = require('mongoose');

const advisoryMemberSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    role: {
        type: String,
        required: true
    },
    organization: {
        type: String,
        required: true
    },
    image: {
        type: String,
        required: true
    },
    imageAlt: {
        type: String,
        required: true
    }
}, { timestamps: true });

module.exports = mongoose.model('AdvisoryMember', advisoryMemberSchema);
