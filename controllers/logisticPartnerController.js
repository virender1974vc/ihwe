const logisticPartnerService = require('../services/logisticPartnerService');
const { logActivity } = require('../utils/logger');

class LogisticPartnerController {
    /**
     * Get LogisticPartner content.
     */
    async getContent(req, res) {
        try {
            const data = await logisticPartnerService.getContent();
            res.json({ success: true, data });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    /**
     * Save LogisticPartner content.
     */
    async saveContent(req, res) {
        try {
            const data = await logisticPartnerService.saveContent(req.body);
            await logActivity(req, 'Updated', 'Logistics Partner', 'Updated dynamic logistics partner page layout and packages');
            res.json({ success: true, data });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
}

module.exports = new LogisticPartnerController();
