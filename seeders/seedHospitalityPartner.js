require('dotenv').config();
const mongoose = require('mongoose');
const HospitalityPartner = require('../models/HospitalityPartner');

const defaultData = {
    hero: {
        logoTitle: 'International\nHealth & Wellness\nExpo 2026',
        logoBadge: 'Global Edition',
        logoRightText: 'Collaborate.\nConnect.\nGrow Together.',
        tagline: 'Partner with us as a',
        title: 'Hospitality',
        titleHighlight: 'Partner',
        subtitle: 'Exceptional Experiences. Memorable Stays. Lasting Impressions.',
        description: 'Partner with IHWE 2026 and be the preferred hospitality partner for 8,000+ exhibitors, buyers and decision makers from around the world.',
        topImage: ''
    },
    whyPartner: [
        { text: 'Access 8,000+ exhibitors, buyers & decision makers' },
        { text: 'High visibility before, during & after the event' },
        { text: 'Be part of a trusted global health & wellness platform' },
        { text: 'Build strong partnerships & long-term relationships' },
        { text: 'Enhance brand credibility & market leadership' }
    ],
    stats: [
        { val: '8,000+', label: 'Delegates & Exhibitors Expected', color: '#006b70' },
        { val: 'Multiple', label: 'Exhibitor Segments', color: '#0b1a3a' },
        { val: '3', label: 'Power-Packed Days', color: '#b4841c' },
        { val: 'Unlimited', label: 'Business Opportunities', color: '#006b70' },
        { val: 'High', label: 'Brand Visibility & Exposure', color: '#0b1a3a' }
    ],
    benefits: [
        { title: 'BRAND VISIBILITY', desc: 'Prominent logo placement across IHWE 2026 platforms, signage, digital promotions and hospitality areas.', color: '#0b1a3a' },
        { title: 'DIRECT BUSINESS ACCESS', desc: 'Receive contact details of all exhibitors for exclusive stay offers and hospitality solutions.', color: '#006b70' },
        { title: 'PREFERRED STAY PARTNER', desc: 'Recommended as the official hospitality partner to exhibitors and visitors attending the event.', color: '#0b1a3a' },
        { title: 'EXCLUSIVE VISIBILITY', desc: 'Logo promotion on our website with a direct link to your website.', color: '#006b70' },
        { title: 'ADDITIONAL BENEFITS', desc: 'Inclusion in event directory, social media mentions & emailer promotions.', color: '#0b1a3a' }
    ],
    packages: [
        { name: 'ASSOCIATE PARTNER', price: '₹1,25,000 + GST', color: '#006b70', bg: '#006b70', benefits: ['Logo on website & digital platforms', 'Social media mentions', 'Exhibitor list & emails'] },
        { name: 'PREFERRED PARTNER', price: '₹2,25,000 + GST', color: '#0b1a3a', bg: '#0b1a3a', benefits: ['All benefits of Associate Partner', 'Dedicated email promotions', 'Premium logo placement'] },
        { name: 'PREMIER PARTNER', price: '₹3,75,000 + GST', color: '#b4841c', bg: '#b4841c', benefits: ['All benefits of Preferred Partner', 'On-site branding (hospitality areas)', 'Speaking opportunity / brand showcase', 'Featured listing in all marketing'] }
    ],
    footer: {
        headline: "LET'S CREATE MEMORIES. LET'S DELIVER HOSPITALITY. LET'S GROW TOGETHER!",
        subtext: 'Join hands with IHWE 2026 and be the preferred stay partner for global leaders.',
        email: 'info@ihwe.in',
        phone: '+91 9654900525',
        website: 'www.ihwe.in',
        bottomImage: '',
        registerLink: '/partner-registration?type=hospitality'
    }
};

async function seed() {
    await mongoose.connect(process.env.MONGO_URI_MAIN);
    console.log('✅ Connected to DB');

    let exists = await HospitalityPartner.findOne();
    if (!exists) {
        await HospitalityPartner.create(defaultData);
        console.log(`✅ Created Hospitality Partner data`);
    } else {
        await HospitalityPartner.findOneAndUpdate({}, defaultData);
        console.log(`🔄 Updated Hospitality Partner data`);
    }

    console.log('\n✅ Seeding complete!');
    process.exit(0);
}

seed().catch(err => { console.error(err); process.exit(1); });
