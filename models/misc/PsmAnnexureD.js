const mongoose = require('mongoose');

const PsmAnnexureDSchema = new mongoose.Schema({
    exhibitorId: { type: mongoose.Schema.Types.ObjectId, ref: 'ExhibitorRegistration', required: true },
    data: { type: Map, of: String, default: {} },
    tableData: { type: Array, default: [] },
    status: { type: String, default: 'draft' }
}, { timestamps: true });

module.exports = mongoose.model('PsmAnnexureD', PsmAnnexureDSchema);
