const mongoose = require('mongoose');

const PointSchema = new mongoose.Schema({
    text: { type: String, required: true },
    icon: { type: String, required: false }
});

const StatSchema = new mongoose.Schema({
    title: { type: String, required: true },
    subtitle: { type: String, required: true },
    color: { type: String, required: true }
});

const BenefitSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    icon: { type: String, required: false },
    color: { type: String, required: false }
});

const PackageSchema = new mongoose.Schema({
    title: { type: String, required: true },
    price: { type: String, required: true },
    color: { type: String, required: true },
    list: [{ type: String }]
});

const PrintingBrandingPartnerSchema = new mongoose.Schema({
    hero: {
        subtitle: { type: String, required: true },
        title: { type: String, required: true },
        shortDescription: { type: String, required: true },
        description: { type: String, required: true },
        bgImage: { type: String, default: '' }
    },
    whyPartner: [PointSchema],
    stats: [StatSchema],
    benefits: [BenefitSchema],
    advantages: [PointSchema],
    packages: [PackageSchema],
    footer: {
        successTitle: { type: String, required: true },
        successSub: { type: String, required: true },
        email: { type: String, required: true },
        phone: { type: String, required: true },
        website: { type: String, required: true },
        registerLink: { type: String, default: '/partner-registration?type=printing' }
    },
    lastUpdated: { type: Date, default: Date.now }
});

module.exports = mongoose.model('PrintingBrandingPartner', PrintingBrandingPartnerSchema);
