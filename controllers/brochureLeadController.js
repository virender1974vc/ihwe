const BrochureLead = require('../models/BrochureLead');

/**
 * Controller to handle Brochure Lead requests.
 */
class BrochureLeadController {
    /**
     * Create a new brochure lead.
     */
    async createLead(req, res) {
        try {
            const { name, company, phone, interest } = req.body;

            if (!name || !company || !phone || !interest) {
                return res.status(400).json({ success: false, message: 'Please fill all fields' });
            }

            const newLead = new BrochureLead({
                name,
                company,
                phone,
                interest
            });

            await newLead.save();
            res.status(201).json({ success: true, message: 'Lead saved successfully' });
        } catch (error) {
            console.error('Create brochure lead error:', error);
            res.status(500).json({ success: false, message: 'Server error' });
        }
    }

    /**
     * Get all brochure leads (for admin).
     */
    async getAllLeads(req, res) {
        try {
            const data = await BrochureLead.find().sort({ createdAt: -1 });
            res.json({ success: true, data });
        } catch (error) {
            console.error('Fetch brochure leads error:', error);
            res.status(500).json({ success: false, message: 'Server error' });
        }
    }
}

module.exports = new BrochureLeadController();
