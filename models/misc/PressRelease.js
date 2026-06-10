const mongoose = require('mongoose');

const pressReleaseSchema = new mongoose.Schema({
    title: { type: String, required: true },
    date: { type: String },
    summary: { type: String },
    image: { type: String },
    file: { type: String, required: true },
    isActive: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
    updatedBy: { type: String }
}, { timestamps: true });



module.exports = mongoose.model('PressRelease', pressReleaseSchema);
