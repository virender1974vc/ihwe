const partnerCategoriesService = require('../../services/exhibitor_seller/partnerCategoriesService');
const { logActivity } = require('../../utils/logger');

/**
 * Controller to handle PartnerCategories actions.
 */
class PartnerCategoriesController {
    /**
     * Get PartnerCategories content.
     */
    async getContent(req, res) {
        try {
            const data = await partnerCategoriesService.getContent();
            res.json({ success: true, data });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    /**
     * Save PartnerCategories content.
     */
    async saveContent(req, res) {
        try {
            const data = await partnerCategoriesService.saveContent(req.body);
            await logActivity(req, 'Updated', 'Partner Categories', 'Updated dynamic partner cards and benefits list');
            res.json({ success: true, data });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
}

module.exports = new PartnerCategoriesController();
