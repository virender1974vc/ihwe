const mongoose = require('mongoose');

const HeroSchema = new mongoose.Schema({
    tagline: { type: String, required: true },
    title: { type: String, required: true },
    titleHighlight: { type: String, required: true },
    subtitle: { type: String, required: true },
    description: { type: String, required: true },
    topImage: { type: String, default: '' }
});

const WhyPartnerSchema = new mongoose.Schema({
    text: { type: String, required: true }
});

const StatSchema = new mongoose.Schema({
    val: { type: String, required: true },
    label: { type: String, required: true },
    icon: { type: String, default: '' },
    color: { type: String, default: '#000000' }
});

const BenefitSchema = new mongoose.Schema({
    title: { type: String, required: true },
    desc: { type: String, required: true },
    icon: { type: String, default: '' },
    color: { type: String, default: '#000000' }
});

const PackageSchema = new mongoose.Schema({
    name: { type: String, required: true },
    price: { type: String, required: true },
    color: { type: String, default: '#000000' },
    bg: { type: String, default: '#ffffff' },
    benefits: [{ type: String }]
});

const FooterSchema = new mongoose.Schema({
    headline: { type: String, required: true },
    subtext: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    website: { type: String, required: true },
    bottomImage: { type: String, default: '' },
    registerLink: { type: String, default: '/partner-registration?type=hospitality' }
});

const HospitalityPartnerSchema = new mongoose.Schema({
    hero: HeroSchema,
    whyPartner: [WhyPartnerSchema],
    stats: [StatSchema],
    benefits: [BenefitSchema],
    packages: [PackageSchema],
    footer: FooterSchema,
    lastUpdated: { type: Date, default: Date.now }
});

module.exports = mongoose.model('HospitalityPartner', HospitalityPartnerSchema);
