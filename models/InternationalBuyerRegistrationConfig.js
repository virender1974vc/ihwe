const mongoose = require('mongoose');

const PackageBenefitSchema = new mongoose.Schema({
    name: { type: String, required: true },
    price: { type: Number, required: true },
    category: { type: String, default: 'Pass' }, // 'Pass' or 'Membership'
    targetAudience: { type: String }, // e.g., "For Serious Buyers & Decision Makers"
    tagline: { type: String }, // e.g., "For Emerging Buyers & Business Explorers"
    description: { type: String },
    whyChoose: { type: String },
    isRecommended: { type: Boolean, default: false },
    badge: { type: String }, // e.g., "Best Value", "Recommended"
    cta: { type: String, default: "Select" }, // e.g., "Become a Member", "Get Membership"
    color: { type: String, default: "blue" }, // e.g., "blue", "yellow", "green", "red"
    benefits: [{ type: String }]
});

const InternationalBuyerRegistrationConfigSchema = new mongoose.Schema({
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
    purchaseFrequencyOptions: [{ type: String }],
    businessModelOptions: [{ type: String }],
    meetingCategoryOptions: [{ type: String }],
    meetingDayOptions: [{ type: String }],
    exhibitorTypeOptions: [{ type: String }],
    companySizes: [{ type: String }],
    certificationOptions: [{ type: String }],
    numberOfMeetingsOptions: [{ type: String }],
    meetingObjectiveOptions: [{ type: String }],
    preferredBusinessTypeOptions: [{ type: String }],
    packages: [PackageBenefitSchema],
    lastUpdatedBy: { type: String, default: null }
}, { timestamps: true });

module.exports = mongoose.model('InternationalBuyerRegistrationConfig', InternationalBuyerRegistrationConfigSchema);
