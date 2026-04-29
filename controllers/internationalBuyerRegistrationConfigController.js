const InternationalBuyerRegistrationConfig = require('../models/InternationalBuyerRegistrationConfig');

/**
 * Controller to handle International Buyer Registration Configuration.
 */
class InternationalBuyerRegistrationConfigController {

    async getConfig(req, res) {
        try {
            let config = await InternationalBuyerRegistrationConfig.findOne();

            // Dynamically load Active records from admin-managed collections
            const BusinessType = require('../models/add_by_admin/BusinessType');
            const AnnualTurnover = require('../models/add_by_admin/AnnualTurnover');
            const PrimaryProductInterest = require('../models/add_by_admin/PrimaryProductInterest');
            const SecondaryProduct = require('../models/add_by_admin/SecondaryProduct');
            const MeetingPriorityLevel = require('../models/add_by_admin/MeetingPriorityLevel');

            const [bizTypes, annualTurnovers, primaryProducts, secondaryProducts, meetingPriorities] = await Promise.all([
                BusinessType.find({ status: 'Active' }),
                AnnualTurnover.find({ status: 'Active' }),
                PrimaryProductInterest.find({ status: 'Active' }),
                SecondaryProduct.find({ status: 'Active' }),
                MeetingPriorityLevel.find({ status: 'Active' })
            ]);

            const defaultPackages = [
                {
                    name: "Standard Buyer Pass",
                    price: 999,
                    category: "Pass",
                    cta: "Register Now",
                    tagline: "For Emerging Buyers & Business Explorers",
                    description: "Designed for professionals who want to explore new products, suppliers, and market opportunities through structured Buyer–Seller interactions.",
                    whyChoose: "A great starting point to explore opportunities and build initial business connections.",
                    isRecommended: false,
                    color: "blue",
                    benefits: [
                        "Opportunity to participate in Buyer–Seller Meet interactions (subject to availability)",
                        "Initiate self-managed B2B meetings",
                        "Basic support for connecting with relevant exhibitors",
                        "Access to a wide range of products & innovations",
                        "Lunch Coupon (Standard Meal)"
                    ]
                },
                {
                    name: "VIP Buyer Pass",
                    price: 4999,
                    category: "Pass",
                    cta: "Register Now",
                    badge: "Recommended",
                    tagline: "For Serious Buyers & Decision Makers",
                    description: "Crafted for high-intent buyers who are looking for structured, result-oriented meetings and premium networking.",
                    whyChoose: "Perfect for buyers who want focused meetings, comfort, and faster business outcomes.",
                    isRecommended: true,
                    color: "yellow",
                    benefits: [
                        "Pre-scheduled & curated B2B meetings",
                        "Dedicated assistance for meeting coordination",
                        "Access to VIP Lounge & premium networking areas",
                        "Priority support & faster entry experience",
                        "Enhanced visibility among exhibitors",
                        "Complimentary Lunch (VIP Lounge / Premium Service)"
                    ]
                },
                {
                    name: "ICOA Standard Buyer Membership",
                    price: 1999,
                    category: "Membership",
                    cta: "Become a Member",
                    tagline: "For Active Buyers & Market Explorers",
                    description: "The Buyer–Seller Meet at IHWE 2026 is being conducted in association with the International Council of AYUSH (ICOA), bringing you access to a trusted network of verified suppliers and brands.",
                    whyChoose: "Ideal for buyers who want to explore the AYUSH and wellness ecosystem and build reliable connections.",
                    color: "blue",
                    benefits: [
                        "Access to Buyer–Seller Meet opportunities curated by ICOA at IHWE & associated events",
                        "Opportunity to participate in B2B meetings (subject to availability)",
                        "Basic support for connecting with relevant suppliers from the ICOA network",
                        "Regular updates on new products, innovations, and sourcing opportunities",
                        "General access to ICOA-associated events"
                    ]
                },
                {
                    name: "ICOA VIP Buyer Membership",
                    price: 9999,
                    category: "Membership",
                    badge: "Recommended",
                    cta: "Upgrade to VIP Membership",
                    targetAudience: "For Serious Buyers & Decision Makers",
                    description: "Experience structured and high-value business networking through ICOA-curated Buyer–Seller Meets at IHWE and beyond.",
                    whyChoose: "Best suited for buyers who want focused meetings, verified suppliers, and faster business outcomes.",
                    benefits: [
                        "Priority access to ICOA-curated Buyer–Seller Meets",
                        "Pre-scheduled & curated B2B meetings based on your requirements",
                        "Dedicated assistance for supplier matchmaking",
                        "Access to VIP networking lounges at IHWE",
                        "Priority entry & premium on-ground support",
                        "Year-round supplier sourcing support via ICOA network"
                    ]
                },
                {
                    name: "ICOA Elite Buyer Membership",
                    price: 25000,
                    category: "Membership",
                    cta: "Get Elite Membership",
                    tagline: "For High-Value & Institutional Buyers",
                    description: "An exclusive membership offering a fully managed sourcing experience through ICOA’s curated network and IHWE platform.",
                    whyChoose: "Designed for buyers who want a complete sourcing ecosystem with strategic business support.",
                    color: "red",
                    benefits: [
                        "Fully curated B2B meetings conducted by ICOA across IHWE and associated platforms",
                        "Dedicated Relationship Manager for end-to-end coordination",
                        "Priority access to all business networking opportunities",
                        "Personalized supplier discovery & sourcing support (year-round)",
                        "Invitations to exclusive business networking sessions",
                        "Premium hospitality & priority services at IHWE"
                    ]
                }
            ];

            if (!config) {
                config = new InternationalBuyerRegistrationConfig({
                    companyTypes: ["Importer", "Distributor", "Retailer", "Wholesaler", "Hospital", "Wellness Center", "Others"],
                    annualTurnoverRanges: ["< 10 Lakhs", "10 - 50 Lakhs", "50 Lakhs - 1 Crore", "1 - 5 Crores", "5 - 10 Crores", "> 10 Crores"],
                    regions: ["Global", "North America", "Europe", "Asia", "Middle East", "Africa"],
                    supplierTypes: ["Manufacturer", "Exporter", "MSME", "Startup", "Wholesaler"],
                    purchaseTimelines: ["Immediate", "1–3 Months", "3–6 Months", "Exploring"],
                    roles: ["Final Decision Maker", "Influencer", "Research Only"],
                    secondaryProductCategories: ["Ayurveda", "Organic", "Wellness", "Pharma", "Cosmetics"],
                    buyingFrequencies: ["One-time", "Monthly", "Quarterly", "Long-term"],
                    annualPurchaseValueRanges: ["< 10 Lakhs", "10 - 50 Lakhs", "50 Lakhs - 1 Crore", "1 - 5 Crores", "5 - 10 Crores", "> 10 Crores"],
                    primaryProductInterests: ["Ayurveda", "Organic", "Wellness", "Pharma", "Cosmetics"],
                    budgetRanges: ["< 5 Lakhs", "5 - 10 Lakhs", "10 - 25 Lakhs", "25 - 50 Lakhs", "> 50 Lakhs"],
                    purchaseFrequencyOptions: ["Regular (Monthly Procurement)", "Seasonal Buying", "One-Time Bulk Purchase", "Exploring Opportunities"],
                    businessModelOptions: ["Private Label / White Label", "Bulk Purchase", "Exclusive Distribution", "Franchise Opportunity", "OEM Manufacturing"],
                    meetingCategoryOptions: ["Ayurveda & Herbal", "Organic Food & Beverages", "Nutraceuticals & Supplements", "Fitness Equipment", "Beauty & Cosmetics", "Skincare", "Medical Devices", "Wellness Services", "Spa & Salon", "HealthTech", "Others (Specify)"],
                    meetingDayOptions: ["Day 1", "Day 2", "Day 3", "Flexible"],
                    exhibitorTypeOptions: ["Manufacturer", "Brand Owner", "Distributor", "Exporter", "Startup / Innovator"],
                    companySizes: ["Small", "Medium", "Large"],
                    certificationOptions: ["ISO", "GMP", "FDA", "AYUSH", "Organic", "Others"],
                    numberOfMeetingsOptions: ["3–5 Meetings", "5–10 Meetings", "10+ Meetings"],
                    meetingObjectiveOptions: ["Product Sourcing", "Partnership / Collaboration", "Distribution Opportunities", "Private Label / OEM", "Investment / Business Expansion"],
                    preferredBusinessTypeOptions: ["Bulk Purchase", "Private Label", "Franchise", "Exclusive Distribution"],
                    packages: defaultPackages
                });
                await config.save();
            }

            res.json({
                success: true, data: {
                    ...config.toObject(),
                    companyTypes: bizTypes.length > 0 ? bizTypes.map(b => b.business_type) : config.companyTypes,
                    annualTurnoverRanges: annualTurnovers.length > 0 ? annualTurnovers.map(a => a.annual_turnover) : config.annualTurnoverRanges,
                    primaryProductInterests: primaryProducts.length > 0 ? primaryProducts.map(p => p.primary_product_interest) : config.primaryProductInterests,
                    secondaryProductCategories: secondaryProducts.length > 0 ? secondaryProducts.map(s => s.secondary_product_categories) : config.secondaryProductCategories,
                    meetingPriorityLevels: meetingPriorities.length > 0 ? meetingPriorities.map(m => m.meeting_priority_level) : ['Low', 'Medium', 'High']
                }
            });
        } catch (err) {
            console.error('Error fetching international buyer registration config:', err);
            res.status(500).json({ success: false, message: 'Server Error' });
        }
    }

    async updateConfig(req, res) {
        try {
            let config = await InternationalBuyerRegistrationConfig.findOne();
            if (!config) {
                config = new InternationalBuyerRegistrationConfig(req.body);
            } else {
                const fields = [
                    'companyTypes', 'annualTurnoverRanges', 'regions', 'supplierTypes', 
                    'purchaseTimelines', 'roles', 'secondaryProductCategories', 
                    'buyingFrequencies', 'annualPurchaseValueRanges', 'primaryProductInterests', 
                    'budgetRanges', 'purchaseFrequencyOptions', 'businessModelOptions', 
                    'meetingCategoryOptions', 'meetingDayOptions', 'exhibitorTypeOptions', 
                    'companySizes', 'certificationOptions', 'numberOfMeetingsOptions', 
                    'meetingObjectiveOptions', 'preferredBusinessTypeOptions', 'packages'
                ];
                fields.forEach(field => {
                    if (req.body[field]) config[field] = req.body[field];
                });
                config.lastUpdatedBy = req.body.lastUpdatedBy || null;
            }

            await config.save();
            res.json({ success: true, message: 'Configuration updated successfully', data: config });
        } catch (err) {
            console.error('Error updating international buyer registration config:', err);
            res.status(500).json({ success: false, message: 'Server Error' });
        }
    }
}

module.exports = new InternationalBuyerRegistrationConfigController();
