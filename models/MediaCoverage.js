const mongoose = require('mongoose');

const mediaCoverageSchema = new mongoose.Schema({
    title: { type: String, required: true },
    logo: { type: String, required: true },
    image: { type: String },
    date: { type: String },
    link: { type: String },
    isActive: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
    updatedBy: { type: String }
}, { timestamps: true });



module.exports = mongoose.model('MediaCoverage', mediaCoverageSchema);
