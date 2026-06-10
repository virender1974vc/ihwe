const mongoose = require('mongoose');

const mediaVideoSchema = new mongoose.Schema({
    title: { type: String, required: true },
    duration: { type: String },
    thumbnail: { type: String },
    videoUrl: { type: String, required: true },
    isActive: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
    updatedBy: { type: String }
}, { timestamps: true });


module.exports = mongoose.model('MediaVideo', mediaVideoSchema);
