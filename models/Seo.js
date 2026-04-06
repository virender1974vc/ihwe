const mongoose = require('mongoose');

const seoSchema = new mongoose.Schema({
    page: {
        type: String,
        required: true,
        unique: true
    },
    metaTitle: {
        type: String,
        trim: true
    },
    metaKeywords: {
        type: String,
        trim: true
    },
    metaDescription: {
        type: String,
        trim: true
    },
    openGraphTags: {
        type: String
    },
    schemaMarkup: {
        type: String
    },
    canonicalTag: {
        type: String
    },
    ogImage: {
        type: String
    },
    isActive: {
        type: Boolean,
        default: true
    },
    updatedBy: {
        type: String,
        default: "System"
    }
}, { timestamps: true });

module.exports = mongoose.model('Seo', seoSchema);
