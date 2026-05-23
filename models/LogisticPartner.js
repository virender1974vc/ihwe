const mongoose = require('mongoose');

const PointSchema = new mongoose.Schema({
    text: { type: String, required: true },
    icon: { type: String, required: true }
});

const StatSchema = new mongoose.Schema({
    icon: { type: String, required: true },
    value: { type: String, required: true },
    label: { type: String, required: true },
    color: { type: String, required: true }
});

const MainBenefitSchema = new mongoose.Schema({
    title: { type: String, required: true },
    text: { type: String, required: true },
    icon: { type: String, required: true },
    color: { type: String, required: true }
});

const PackageSchema = new mongoose.Schema({
    name: { type: String, required: true },
    price: { type: String, required: true },
    color: { type: String, required: true },
    icon: { type: String, required: true },
    features: [{ type: String }]
});

const LogisticPartnerSchema = new mongoose.Schema({
    hero: {
        title: { type: String, required: true },
        subTitle: { type: String, required: true },
        bgImage: { type: String, default: "" },
        whyPartnerTitle: { type: String, required: true },
        whyPartnerPoints: [PointSchema]
    },
    stats: [StatSchema],
    benefits: {
        main: [MainBenefitSchema],
        additionalTitle: { type: String, required: true },
        additional: [PointSchema]
    },
    packages: [PackageSchema],
    footer: {
        successTitle: { type: String, required: true },
        successSub: { type: String, required: true },
        email: { type: String, required: true },
        phone: { type: String, required: true },
        website: { type: String, required: true }
    },
    lastUpdated: { type: Date, default: Date.now }
});

module.exports = mongoose.model('LogisticPartner', LogisticPartnerSchema);
