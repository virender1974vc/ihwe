const mongoose = require('mongoose');

const PsmPfmsDetailsSchema = new mongoose.Schema({
    exhibitorId: { type: mongoose.Schema.Types.ObjectId, ref: 'ExhibitorRegistration', required: true },
    data: { type: Map, of: String, default: {} },
    status: { type: String, default: 'draft' }
}, { timestamps: true });

module.exports = mongoose.model('PsmPfmsDetails', PsmPfmsDetailsSchema);
