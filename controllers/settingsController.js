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
            const { 
                emails, phones, addresses, mapIframe, marqueeText, topbarDate, 
                supportDeskText, onlineAdvancePercentage, manualAdvancePercentage, 
                quickLinks, exhibitionLinks,
                companyName, companyAddress, companyGst, companyCin, 
                fullPaymentDiscount, availableTdsRates
            } = req.body;
            
            const updateData = {
                emails: emails ? JSON.parse(emails) : undefined,
                phones: phones ? JSON.parse(phones) : undefined,
                addresses: addresses ? JSON.parse(addresses) : undefined,
                quickLinks: quickLinks ? JSON.parse(quickLinks) : undefined,
                exhibitionLinks: exhibitionLinks ? JSON.parse(exhibitionLinks) : undefined,
                availableTdsRates: availableTdsRates ? (typeof availableTdsRates === 'string' ? JSON.parse(availableTdsRates) : availableTdsRates) : undefined,
                mapIframe,
                marqueeText,
                topbarDate,
                supportDeskText,
                companyName,
                companyAddress,
                companyGst,
                companyCin,
                onlineAdvancePercentage: onlineAdvancePercentage ? Number(onlineAdvancePercentage) : undefined,
                manualAdvancePercentage: manualAdvancePercentage ? Number(manualAdvancePercentage) : undefined,
                fullPaymentDiscount: fullPaymentDiscount ? Number(fullPaymentDiscount) : undefined
            };

            if (req.files) {
                if (req.files.logo) {
                    updateData.logo = `/uploads/settings/${req.files.logo[0].filename}`;
                }
                if (req.files.exhibitorBrochurePdf) {
                    updateData.exhibitorBrochurePdf = `/uploads/settings/${req.files.exhibitorBrochurePdf[0].filename}`;
                }
                if (req.files.authorizedSignature) {
                    updateData.authorizedSignature = `/uploads/settings/${req.files.authorizedSignature[0].filename}`;
                }
                if (req.files.companyStamp) {
                    updateData.companyStamp = `/uploads/settings/${req.files.companyStamp[0].filename}`;
                }
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
