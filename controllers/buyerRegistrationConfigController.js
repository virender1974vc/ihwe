const BuyerRegistrationConfig = require('../models/BuyerRegistrationConfig');

/**
 * Controller to handle Buyer Registration Configuration.
 */
class BuyerRegistrationConfigController {

    async getConfig(req, res) {
        try {
            let config = await BuyerRegistrationConfig.findOne();

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
                config = new BuyerRegistrationConfig({
                    companyTypes: ["Importer", "Distributor", "Retailer", "Wholesaler", "Hospital", "Wellness Center", "Others"],
                    annualTurnoverRanges: ["< 10 Lakhs", "10 - 50 Lakhs", "50 Lakhs - 1 Crore", "1 - 5 Crores", "5 - 10 Crores", "> 10 Crores"],
                    regions: ["North India", "South India", "East India", "West India", "Pan India", "Global"],
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
            } else {
                // Migration: Ensure packages exist if missing
                if (!config.packages || config.packages.length === 0) {
                    config.packages = defaultPackages;
                }

                // Ensure "Global" is added to existing configs if missing
                if (config.regions && !config.regions.includes("Global")) {
                    config.regions.push("Global");
                }

                if (!config.primaryProductInterests || config.primaryProductInterests.length === 0) {
                    config.primaryProductInterests = ["Ayurveda", "Organic", "Wellness", "Pharma", "Cosmetics"];
                }
                if (!config.buyingFrequencies || config.buyingFrequencies.length === 0) {
                    config.buyingFrequencies = ["One-time", "Monthly", "Quarterly", "Long-term"];
                }
                if (!config.annualPurchaseValueRanges || config.annualPurchaseValueRanges.length === 0) {
                    config.annualPurchaseValueRanges = ["< 10 Lakhs", "10 - 50 Lakhs", "50 Lakhs - 1 Crore", "1 - 5 Crores", "5 - 10 Crores", "> 10 Crores"];
                }
                if (!config.budgetRanges || config.budgetRanges.length === 0) {
                    config.budgetRanges = ["< 5 Lakhs", "5 - 10 Lakhs", "10 - 25 Lakhs", "25 - 50 Lakhs", "> 50 Lakhs"];
                }
                if (!config.purchaseFrequencyOptions || config.purchaseFrequencyOptions.length === 0) {
                    config.purchaseFrequencyOptions = ["Regular (Monthly Procurement)", "Seasonal Buying", "One-Time Bulk Purchase", "Exploring Opportunities"];
                }
                if (!config.businessModelOptions || config.businessModelOptions.length === 0) {
                    config.businessModelOptions = ["Private Label / White Label", "Bulk Purchase", "Exclusive Distribution", "Franchise Opportunity", "OEM Manufacturing"];
                }
                if (!config.meetingCategoryOptions || config.meetingCategoryOptions.length === 0) {
                    config.meetingCategoryOptions = ["Ayurveda & Herbal", "Organic Food & Beverages", "Nutraceuticals & Supplements", "Fitness Equipment", "Beauty & Cosmetics", "Skincare", "Medical Devices", "Wellness Services", "Spa & Salon", "HealthTech", "Others (Specify)"];
                }
                if (!config.meetingDayOptions || config.meetingDayOptions.length === 0) {
                    config.meetingDayOptions = ["Day 1", "Day 2", "Day 3", "Flexible"];
                }
                if (!config.exhibitorTypeOptions || config.exhibitorTypeOptions.length === 0) {
                    config.exhibitorTypeOptions = ["Manufacturer", "Brand Owner", "Distributor", "Exporter", "Startup / Innovator"];
                }
                if (!config.companySizes || config.companySizes.length === 0) {
                    config.companySizes = ["Small", "Medium", "Large"];
                }
                if (!config.certificationOptions || config.certificationOptions.length === 0) {
                    config.certificationOptions = ["ISO", "GMP", "FDA", "AYUSH", "Organic", "Others"];
                }
                if (!config.numberOfMeetingsOptions || config.numberOfMeetingsOptions.length === 0) {
                    config.numberOfMeetingsOptions = ["3–5 Meetings", "5–10 Meetings", "10+ Meetings"];
                }
                if (!config.meetingObjectiveOptions || config.meetingObjectiveOptions.length === 0) {
                    config.meetingObjectiveOptions = ["Product Sourcing", "Partnership / Collaboration", "Distribution Opportunities", "Private Label / OEM", "Investment / Business Expansion"];
                }
                if (!config.preferredBusinessTypeOptions || config.preferredBusinessTypeOptions.length === 0) {
                    config.preferredBusinessTypeOptions = ["Bulk Purchase", "Private Label", "Franchise", "Exclusive Distribution"];
                }
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
            console.error('Error fetching buyer registration config:', err);
            res.status(500).json({ success: false, message: 'Server Error' });
        }
    }

    /**
     * Update the configuration.
     */
    async updateConfig(req, res) {
        try {
            let config = await BuyerRegistrationConfig.findOne();
            if (!config) {
                config = new BuyerRegistrationConfig(req.body);
            } else {
                // Update fields
                const { companyTypes, annualTurnoverRanges, regions, supplierTypes, purchaseTimelines, roles, secondaryProductCategories, buyingFrequencies, annualPurchaseValueRanges, primaryProductInterests, budgetRanges, purchaseFrequencyOptions, businessModelOptions, meetingCategoryOptions, meetingDayOptions, exhibitorTypeOptions, companySizes, certificationOptions, numberOfMeetingsOptions, meetingObjectiveOptions, preferredBusinessTypeOptions, packages, lastUpdatedBy } = req.body;
                if (companyTypes) config.companyTypes = companyTypes;
                if (annualTurnoverRanges) config.annualTurnoverRanges = annualTurnoverRanges;
                if (regions) config.regions = regions;
                if (supplierTypes) config.supplierTypes = supplierTypes;
                if (purchaseTimelines) config.purchaseTimelines = purchaseTimelines;
                if (roles) config.roles = roles;
                if (secondaryProductCategories) config.secondaryProductCategories = secondaryProductCategories;
                if (buyingFrequencies) config.buyingFrequencies = buyingFrequencies;
                if (annualPurchaseValueRanges) config.annualPurchaseValueRanges = annualPurchaseValueRanges;
                if (primaryProductInterests) config.primaryProductInterests = primaryProductInterests;
                if (budgetRanges) config.budgetRanges = budgetRanges;
                if (purchaseFrequencyOptions) config.purchaseFrequencyOptions = purchaseFrequencyOptions;
                if (businessModelOptions) config.businessModelOptions = businessModelOptions;
                if (meetingCategoryOptions) config.meetingCategoryOptions = meetingCategoryOptions;
                if (meetingDayOptions) config.meetingDayOptions = meetingDayOptions;
                if (exhibitorTypeOptions) config.exhibitorTypeOptions = exhibitorTypeOptions;
                if (companySizes) config.companySizes = companySizes;
                if (certificationOptions) config.certificationOptions = certificationOptions;
                if (numberOfMeetingsOptions) config.numberOfMeetingsOptions = numberOfMeetingsOptions;
                if (meetingObjectiveOptions) config.meetingObjectiveOptions = meetingObjectiveOptions;
                if (preferredBusinessTypeOptions) config.preferredBusinessTypeOptions = preferredBusinessTypeOptions;
                if (packages) config.packages = packages;
                config.lastUpdatedBy = lastUpdatedBy || null;
            }

            await config.save();
            res.json({ success: true, message: 'Configuration updated successfully', data: config });
        } catch (err) {
            console.error('Error updating buyer registration config:', err);
            res.status(500).json({ success: false, message: 'Server Error' });
        }
    }
}

module.exports = new BuyerRegistrationConfigController();
