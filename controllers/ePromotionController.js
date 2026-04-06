const ePromotionService = require('../services/ePromotionService');
const { logActivity } = require('../utils/logger');

/**
 * Controller to handle E-Promotion requests.
 */
class EPromotionController {
    /**
     * Get content.
     */
    async getContent(req, res) {
        try {
            const data = await ePromotionService.getContent();
            res.json({ success: true, data });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    /**
     * Update content.
     */
    async updateContent(req, res) {
        try {
            const data = await ePromotionService.updateContent(req.body);
            await logActivity(req, 'Updated', 'E-Promotion Management', 'Updated E-Promotion content');
            res.json({ success: true, message: 'Content updated successfully', data });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    /**
     * Submit enquiry.
     */
    async submitEnquiry(req, res) {
        try {
            await ePromotionService.submitEnquiry(req.body);
            res.status(201).json({ success: true, message: 'Enquiry submitted successfully' });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    /**
     * Get all enquiries.
     */
    async getAllEnquiries(req, res) {
        try {
            const data = await ePromotionService.getAllEnquiries();
            res.json({ success: true, data });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    /**
     * Delete enquiry.
     */
    async deleteEnquiry(req, res) {
        try {
            await ePromotionService.deleteEnquiry(req.params.id);
            await logActivity(req, 'Deleted', 'E-Promotion Management', `Deleted e-promotion enquiry ID: ${req.params.id}`);
            res.json({ success: true, message: 'Enquiry deleted successfully' });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
}

module.exports = new EPromotionController();
