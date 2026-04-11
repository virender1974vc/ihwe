const settingsService = require('../services/settingsService');

/**
 * Controller to handle Settings requests.
 */
class SettingsController {
    /**
     * Get system settings.
     */
    async getSettings(req, res) {
        try {
            const data = await settingsService.getSettings();
            res.json({ success: true, data });
        } catch (error) {
            console.error('Fetch settings error:', error);
            res.status(500).json({ success: false, message: 'Server error' });
        }
    }

    /**
     * Update system settings.
     */
    async updateSettings(req, res) {
        try {
            const { emails, phones, addresses, mapIframe, marqueeText, topbarDate, supportDeskText, onlineAdvancePercentage, manualAdvancePercentage, quickLinks, exhibitionLinks } = req.body;
            
            const updateData = {
                emails: emails ? JSON.parse(emails) : undefined,
                phones: phones ? JSON.parse(phones) : undefined,
                addresses: addresses ? JSON.parse(addresses) : undefined,
                quickLinks: quickLinks ? JSON.parse(quickLinks) : undefined,
                exhibitionLinks: exhibitionLinks ? JSON.parse(exhibitionLinks) : undefined,
                mapIframe,
                marqueeText,
                topbarDate,
                supportDeskText,
                onlineAdvancePercentage: onlineAdvancePercentage ? Number(onlineAdvancePercentage) : undefined,
                manualAdvancePercentage: manualAdvancePercentage ? Number(manualAdvancePercentage) : undefined
            };

            if (req.file) {
                updateData.logo = `/uploads/settings/${req.file.filename}`;
            }

            const data = await settingsService.updateSettings(updateData);
            res.json({ success: true, data, message: 'Settings updated successfully' });
        } catch (error) {
            console.error('Update settings error:', error);
            res.status(500).json({ success: false, message: 'Server error' });
        }
    }
}

module.exports = new SettingsController();
