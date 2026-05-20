const PrintingBrandingPartner = require('../models/PrintingBrandingPartner');

class PrintingBrandingPartnerService {
    async getContent() {
        let content = await PrintingBrandingPartner.findOne();
        if (!content) {
            content = await PrintingBrandingPartner.create({
                hero: {
                    subtitle: 'Partner With Us As a',
                    title: 'Printing &\nBranding Partner',
                    shortDescription: 'Bring Ideas to Life. Amplify Brands Create Impact',
                    description: 'Partner with IHWE',
                    bgImage: '/images/printing.jpeg'
                },
                whyPartner: [
                    { text: 'Access 8,000+ exhibitors, buyers and decision makers' },
                    { text: 'High visibility before, during and after the event' },
                    { text: 'Be part of a trusted global health & wellness event' },
                    { text: 'Build strong partnerships & long-term relationships' },
                    { text: 'Enhance brand credibility & market leadership' }
                ],
                stats: [
                    { title: '8,000+', subtitle: 'Delegates & Exhibitors Expected', color: '#6B46C1' },
                    { title: 'Multiple', subtitle: 'Exhibitor Segments', color: '#434190' },
                    { title: '3', subtitle: 'Power-Packed Days', color: '#D53F8C' },
                    { title: 'Unlimited', subtitle: 'Business Opportunities', color: '#3182CE' },
                    { title: 'High', subtitle: 'Brand Visibility & Exposure', color: '#553C9A' }
                ],
                benefits: [
                    { title: 'Brand Visibility', description: 'Prominent logo placement across IHWE 2026 platforms, signage, banners & marketing collaterals', color: '#0B2C66' },
                    { title: 'Direct Business Access', description: 'Receive contact details of all exhibitors for their printing & branding requirements', color: '#4E9F3D' },
                    { title: 'On-site Presence', description: 'Branding at key areas including registration, directions, common areas & main stage.', color: '#0B2C66' },
                    { title: 'Operational Support', description: 'Preferred partner for all printing & branding needs with timely support & smooth coordination.', color: '#4E9F3D' },
                    { title: 'Digital Promotion', description: 'Logo promotion on our website with a direct link to your website.', color: '#0B2C66' }
                ],
                advantages: [
                    { text: 'Exclusive printing & branding partner for exhibitors' },
                    { text: 'Opportunity to showcase samples / portfolio at the expo venue' },
                    { text: 'Access to a network of industry leaders & businesses' },
                    { text: 'Opportunity to offer special discounts to exhibitors' },
                    { text: 'Year-round visibility through pre & post event promotions' }
                ],
                packages: [
                    {
                        title: 'Associate Partner',
                        price: '₹1,25,000',
                        color: '#1E104E',
                        list: ['Logo on website & digital platforms', 'Social media mentions', 'Exhibitor list & emails']
                    },
                    {
                        title: 'Preferred Partner',
                        price: '₹2,25,000',
                        color: '#81912F',
                        list: ['All benefits of Associate Partner', 'Branding at key areas in the venue', 'Premium logo placement']
                    },
                    {
                        title: 'Premier Partner',
                        price: '₹3,75,000',
                        color: 'orange',
                        list: ['All benefits of Preferred Partner', 'On-site branding (booth / signage)', 'Speaking opportunity / brand showcase', 'Featured listing in all marketing']
                    }
                ],
                footer: {
                    successTitle: "LET'S PRINT IMPACT.",
                    successSub: "LET'S BRAND SUCCESS. LET'S GROW TOGETHER!",
                    email: 'partner@ihwe.in',
                    phone: '+91 9654900525',
                    website: 'www.ihwe.in',
                    registerLink: '/partner-registration?type=printing'
                }
            });
        }
        return content;
    }

    async saveContent(data) {
        return await PrintingBrandingPartner.findOneAndUpdate(
            {},
            {
                hero: data.hero,
                whyPartner: data.whyPartner,
                stats: data.stats,
                benefits: data.benefits,
                advantages: data.advantages,
                packages: data.packages,
                footer: data.footer,
                lastUpdated: Date.now()
            },
            { upsert: true, new: true }
        );
    }
}

module.exports = new PrintingBrandingPartnerService();
