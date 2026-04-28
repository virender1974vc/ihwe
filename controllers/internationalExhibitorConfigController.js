const InternationalExhibitorConfig = require('../models/InternationalExhibitorConfig');

class InternationalExhibitorConfigController {
    async getConfig(req, res) {
        try {
            let config = await InternationalExhibitorConfig.findOne();
            if (!config) {

                config = await InternationalExhibitorConfig.create({
                    packages: [
                        { name: 'International Shell Scheme', price: 2500, features: ['9 sqm stall', 'Furniture', 'Lighting'], category: 'Standard', isMembership: false },
                        { name: 'International Bare Space', price: 2200, features: ['Minimum 18 sqm', 'Power point'], category: 'Standard', isMembership: false },
                        { name: 'Premium Pavilion', price: 5000, features: ['VIP Lounge access', 'Priority location'], category: 'Premium', isMembership: false },
                        { name: 'ICOA International Silver', price: 1000, features: ['Directory Listing', 'B2B Priority', 'Certificate'], category: 'Standard', isMembership: true },
                        { name: 'ICOA International Gold', price: 2000, features: ['Logo on Banner', 'Premium Profile', '5 B2B Meetings'], category: 'Premium', isMembership: true },
                        { name: 'ICOA International Diamond', price: 3500, features: ['Title Sponsor logo', 'Main Stage Slot', 'Unlimited B2B'], category: 'VIP', isMembership: true }
                    ]
                });
            }
            res.json({ success: true, data: config });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    async updateConfig(req, res) {
        try {
            const config = await InternationalExhibitorConfig.findOneAndUpdate(
                {},
                { $set: req.body },
                { new: true, upsert: true }
            );
            res.json({ success: true, data: config });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
}

module.exports = new InternationalExhibitorConfigController();
