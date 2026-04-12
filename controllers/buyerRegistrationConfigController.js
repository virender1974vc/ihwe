const BuyerRegistrationConfig = require('../models/BuyerRegistrationConfig');

/**
 * Controller to handle Buyer Registration Configuration.
 */
class BuyerRegistrationConfigController {
    /**
     * Get the current configuration.
     * Seeds default values if nothing exists.
     */
    async getConfig(req, res) {
        try {
            let config = await BuyerRegistrationConfig.findOne();

            if (!config) {

                config = new BuyerRegistrationConfig({
                    companyTypes: ["Importer", "Distributor", "Retailer", "Wholesaler", "Hospital", "Wellness Center", "Others"],
                    annualTurnoverRanges: ["< 10 Lakhs", "10 - 50 Lakhs", "50 Lakhs - 1 Crore", "1 - 5 Crores", "5 - 10 Crores", "> 10 Crores"],
                    regions: ["North India", "South India", "East India", "West India", "Pan India"],
                    supplierTypes: ["Manufacturer", "Exporter", "MSME", "Startup", "Wholesaler"],
                    purchaseTimelines: ["Immediate", "1–3 Months", "3–6 Months", "Exploring"],
                    roles: ["Final Decision Maker", "Influencer", "Research Only"],
                    secondaryProductCategories: ["Ayurveda", "Organic", "Wellness", "Pharma", "Cosmetics"],
                    buyingFrequencies: ["One-time", "Monthly", "Quarterly", "Long-term"],
                    annualPurchaseValueRanges: ["< 10 Lakhs", "10 - 50 Lakhs", "50 Lakhs - 1 Crore", "1 - 5 Crores", "5 - 10 Crores", "> 10 Crores"],
                    primaryProductInterests: ["Ayurveda", "Organic", "Wellness", "Pharma", "Cosmetics"],
                    packages: [
                        {
                            name: "Standard Buyer Pass",
                            price: 999,
                            benefits: ["Access to Expo Floor", "Standard B2B Meeting Lounge", "Digital Directory", "Certificate of Participation"]
                        },
                        {
                            name: "VIP Buyer Pass",
                            price: 2499,
                            benefits: ["Everything in Standard", "Priority Access to B2B Matching", "VIP Networking Lounge Access", "Lunch Inclusive (2 Days)", "Exclusive Networking Dinner"]
                        },
                        {
                            name: "Hosted Buyer",
                            price: 4999,
                            benefits: ["Subject to Selection", "Domestic Airfare Included", "2 Nights 5-Star Stay", "Premium B2B Matchmaking", "Dedicated Relationship Manager"]
                        }
                    ]
                });
                await config.save();
            } else {
                // Lazy seed primaryProductInterests if missing
                let updated = false;
                if (!config.primaryProductInterests || config.primaryProductInterests.length === 0) {
                    config.primaryProductInterests = ["Ayurveda", "Organic", "Wellness", "Pharma", "Cosmetics"];
                    updated = true;
                }
                if (!config.buyingFrequencies || config.buyingFrequencies.length === 0) {
                    config.buyingFrequencies = ["One-time", "Monthly", "Quarterly", "Long-term"];
                    updated = true;
                }
                if (!config.annualPurchaseValueRanges || config.annualPurchaseValueRanges.length === 0) {
                    config.annualPurchaseValueRanges = ["< 10 Lakhs", "10 - 50 Lakhs", "50 Lakhs - 1 Crore", "1 - 5 Crores", "5 - 10 Crores", "> 10 Crores"];
                    updated = true;
                }
                if (updated) await config.save();
            }

            res.json({ success: true, data: config });
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
                const { companyTypes, annualTurnoverRanges, regions, supplierTypes, purchaseTimelines, roles, secondaryProductCategories, buyingFrequencies, annualPurchaseValueRanges, primaryProductInterests, packages, lastUpdatedBy } = req.body;
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
