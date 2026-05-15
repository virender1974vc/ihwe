const mongoose = require('mongoose');

const mediaResourceSchema = new mongoose.Schema({
    title: { type: String, required: true },
    icon: { type: String, default: 'FileText' },
    type: { type: String, enum: ['download', 'view', 'watch'], default: 'view' },
    link: { type: String, required: true },
    isActive: { type: Boolean, default: true },
    isMain: { type: Boolean, default: false },
    order: { type: Number, default: 0 },
    updatedBy: { type: String }
}, { timestamps: true });


module.exports = mongoose.model('MediaResource', mediaResourceSchema);
