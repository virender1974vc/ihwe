const hospitalityPartnerService = require('../services/hospitalityPartnerService');
const { logActivity } = require('../utils/logger');

class HospitalityPartnerController {
    async getContent(req, res) {
        try {
            const data = await hospitalityPartnerService.getContent();
            res.json({ success: true, data });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    async saveContent(req, res) {
        try {
            const data = await hospitalityPartnerService.saveContent(req.body);
            await logActivity(req, 'Updated', 'Hospitality Partner', 'Updated dynamic hospitality partner page');
            res.json({ success: true, data });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
}

module.exports = new HospitalityPartnerController();
