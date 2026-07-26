const mongoose = require('mongoose');

const communicationAssetSchema = new mongoose.Schema({
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    url: { type: String, required: true },
    publicId: { type: String, required: true, unique: true },
    originalName: { type: String, default: '' },
    mimeType: { type: String, default: '' },
    mediaType: { type: String, enum: ['image', 'video', 'document', 'audio'], default: 'document' },
    bytes: { type: Number, default: 0 },
    attachedAt: { type: Date, default: null }
}, { timestamps: true });

module.exports = mongoose.model('CommunicationAsset', communicationAssetSchema);
