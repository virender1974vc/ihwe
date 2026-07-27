const mongoose = require('mongoose');

const PsmPreReceiptSchema = new mongoose.Schema({
    exhibitorId: { type: mongoose.Schema.Types.ObjectId, ref: 'ExhibitorRegistration', required: true },
    revenueStampAmount: String,
    receivedAmount: String,
    fairName: String,
    beneficiaryName: String,
    place: String,
    date: String,
    contactName: String,
    designation: String,
    signaturePlace: String,
    status: { type: String, default: 'draft' }
}, { timestamps: true });

module.exports = mongoose.model('PsmPreReceipt', PsmPreReceiptSchema);
