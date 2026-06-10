const mongoose = require('mongoose');

const PsmDeclarationSchema = new mongoose.Schema({
    exhibitorId: { type: mongoose.Schema.Types.ObjectId, ref: 'ExhibitorRegistration', required: true },
    name: String,
    designation: String,
    date: String,
    place: String,
    status: { type: String, default: 'draft' }
}, { timestamps: true });

module.exports = mongoose.model('PsmDeclaration', PsmDeclarationSchema);
