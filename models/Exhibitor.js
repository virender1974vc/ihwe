const mongoose = require('mongoose');

const exhibitorSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    location: {
        type: String,
        required: true
    },
    category: {
        type: String,
        default: 'OTHERS'
    },
    order: {
        type: Number,
        default: 0
    },
    websiteUrl: {
        type: String,
        default: ''
    },
    image: {
        type: String,
        required: true
    },
    altText: {
        type: String,
        default: ''
    },
    updatedBy: {
        type: String,
        default: 'System'
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Exhibitor', exhibitorSchema);
