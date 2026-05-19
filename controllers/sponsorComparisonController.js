const sponsorComparisonService = require('../services/sponsorComparisonService');
const { logActivity } = require('../utils/logger');

/**
 * Controller to handle SponsorComparison actions.
 */
class SponsorComparisonController {
    /**
     * Get SponsorComparison content.
     */
    async getContent(req, res) {
        try {
            const data = await sponsorComparisonService.getContent();
            res.json({ success: true, data });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    /**
     * Save SponsorComparison content.
     */
    async saveContent(req, res) {
        try {
            const data = await sponsorComparisonService.saveContent(req.body);
            await logActivity(req, 'Updated', 'Sponsorship Options', 'Updated dynamic sponsor cards and comparison table');
            res.json({ success: true, data });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
}

module.exports = new SponsorComparisonController();
