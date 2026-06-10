const mongoose = require('mongoose');

const seoFileSchema = new mongoose.Schema({
    originalName: {
        type: String,
        required: true
    },
    filename: {
        type: String,
        required: true
    },
    path: {
        type: String,
        required: true
    },
    mimetype: {
        type: String
    },
    size: {
        type: Number
    }
}, { timestamps: true });

module.exports = mongoose.model('SeoFile', seoFileSchema);
