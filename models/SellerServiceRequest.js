const mongoose = require('mongoose');

const sellerServiceRequestSchema = new mongoose.Schema({
    exhibitorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ExhibitorRegistration',
        required: true,
    },
    serviceType: { 
        type: String, 
        enum: ['logistics', 'sponsorship', 'marketing', 'helpdesk', 'conference', 'other'],
        required: true 
    },
    serviceName: { type: String, required: true },
    details: { type: Object },
    status: { type: String, enum: ['pending', 'open', 'in-progress', 'resolved', 'completed', 'reviewed', 'approved', 'rejected'], default: 'pending' },
    remarks: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('SellerServiceRequest', sellerServiceRequestSchema);
