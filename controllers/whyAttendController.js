const whyAttendService = require('../services/whyAttendService');

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
            res.json({ success: true, data });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
}

module.exports = new WhyAttendController();
