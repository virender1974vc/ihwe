const whyAttendService = require('../services/whyAttendService');
const { logActivity } = require('../utils/logger');

/**
 * Controller to handle Why Attend section requests.
 */
class WhyAttendController {
    /**
     * Get Why Attend content.
     */
    async getContent(req, res) {
        try {
            const data = await whyAttendService.getContent();
            res.json({ success: true, data });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    /**
     * Update headings.
     */
    async updateHeadings(req, res) {
        try {
            const data = await whyAttendService.updateHeadings(req.body);
            await logActivity(req, 'Updated', 'Why Attend', 'Updated why attend section headings');
            res.json({ success: true, data });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    /**
     * Add card.
     */
    async addCard(req, res) {
        try {
            const data = await whyAttendService.addCard(req.body);
            await logActivity(req, 'Created', 'Why Attend', `Added new attend reason: ${req.body.title || 'Untitled'}`);
            res.json({ success: true, data });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    /**
     * Update card.
     */
    async updateCard(req, res) {
        try {
            const data = await whyAttendService.updateCard(req.params.id, req.body);
            await logActivity(req, 'Updated', 'Why Attend', `Updated attend reason: ${req.body.title || 'ID: ' + req.params.id}`);
            res.json({ success: true, data });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    /**
     * Delete card.
     */
    async deleteCard(req, res) {
        try {
            const data = await whyAttendService.deleteCard(req.params.id);
            await logActivity(req, 'Deleted', 'Why Attend', `Deleted attend reason ID: ${req.params.id}`);
            res.json({ success: true, data });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
}

module.exports = new WhyAttendController();
