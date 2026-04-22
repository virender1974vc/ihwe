const mongoose = require('mongoose');

const PsmAnnexureCSchema = new mongoose.Schema({
    exhibitorId: { type: mongoose.Schema.Types.ObjectId, ref: 'ExhibitorRegistration', required: true },
    fairName: String,
    companyName: String,
    applicationNo: String,
    additionalCopies: { type: String, default: 'No' },
    date: String,
    checks: { type: Map, of: Boolean, default: {} },
    pages: { type: Map, of: String, default: {} },
    status: { type: String, default: 'draft' }
}, { timestamps: true });

module.exports = mongoose.model('PsmAnnexureC', PsmAnnexureCSchema);
