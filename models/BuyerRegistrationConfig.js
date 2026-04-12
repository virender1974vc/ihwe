const mongoose = require('mongoose');

const PackageBenefitSchema = new mongoose.Schema({
    name: { type: String, required: true },
    price: { type: Number, required: true },
    benefits: [{ type: String }]
});

const BuyerRegistrationConfigSchema = new mongoose.Schema({
    companyTypes: [{ type: String }],
    annualTurnoverRanges: [{ type: String }],
    regions: [{ type: String }],
    supplierTypes: [{ type: String }],
    purchaseTimelines: [{ type: String }],
    roles: [{ type: String }],
    secondaryProductCategories: [{ type: String }],
    buyingFrequencies: [{ type: String }],
    annualPurchaseValueRanges: [{ type: String }],
    primaryProductInterests: [{ type: String }],
    budgetRanges: [{ type: String }],
    companySizes: [{ type: String }],
    certificationOptions: [{ type: String }],
    packages: [PackageBenefitSchema],
    lastUpdatedBy: { type: String, default: null }
}, { timestamps: true });

module.exports = mongoose.model('BuyerRegistrationConfig', BuyerRegistrationConfigSchema);
