const mongoose = require('mongoose');

const PsmUndertakingSchema = new mongoose.Schema({
    exhibitorId: { type: mongoose.Schema.Types.ObjectId, ref: 'ExhibitorRegistration', required: true },
    name: String,
    parentName: String,
    designation: String,
    companyName: String,
    udyamNumber: String,
    officeAddress: String,
    factoryAddress: String,
    manufacturingActivity: String,
    exhibitionName: String,
    stallNo: String,
    venue: String,
    pincode: String,
    fromDate: String,
    toDate: String,
    finYear: String,
    signatoryName: String,
    status: { type: String, default: 'draft' }
}, { timestamps: true });

module.exports = mongoose.model('PsmUndertaking', PsmUndertakingSchema);
