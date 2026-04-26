const mongoose = require('mongoose');

const productExportInquirySchema = new mongoose.Schema({
    exhibitorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ExhibitorRegistration',
        required: true,
    },
    brandName: { type: String, required: true },
    contactPerson: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    productCategories: [String],
    targetCountries: [String],
    exportExperience: { type: String, enum: ['beginner', 'intermediate', 'expert'] },
    certifications: [String],
    message: { type: String },
    status: { type: String, enum: ['pending', 'reviewed', 'contacted'], default: 'pending' }
}, { timestamps: true });

module.exports = mongoose.model('ProductExportInquiry', productExportInquirySchema);
