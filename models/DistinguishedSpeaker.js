const mongoose = require('mongoose');

const distinguishedSpeakerSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    designation: { type: String, required: true, trim: true },
    organization: { type: String, default: "", trim: true },
    topic: { type: String, default: "" },
    image: { type: String, default: "" },
    flag: { type: String, default: "🇮🇳" },
    order: { type: Number, default: 0 },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' }
}, { timestamps: true });

module.exports = mongoose.model('DistinguishedSpeaker', distinguishedSpeakerSchema);
