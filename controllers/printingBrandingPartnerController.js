const printingBrandingPartnerService = require('../services/printingBrandingPartnerService');
const { logActivity } = require('../utils/logger');

class PrintingBrandingPartnerController {
    async getContent(req, res) {
        try {
            const data = await printingBrandingPartnerService.getContent();
            res.json({ success: true, data });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    async saveContent(req, res) {
        try {
            const data = await printingBrandingPartnerService.saveContent(req.body);
            await logActivity(req, 'Updated', 'Printing & Branding Partner', 'Updated dynamic printing & branding partner page');
            res.json({ success: true, data });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
}

module.exports = new PrintingBrandingPartnerController();
