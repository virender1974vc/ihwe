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
                fullPaymentDiscount, availableTdsRates,
                msmeLogos, isMsmeLogoActive
            } = req.body;
            
            const updateData = {
                emails: emails ? JSON.parse(emails) : undefined,
                phones: phones ? JSON.parse(phones) : undefined,
                addresses: addresses ? JSON.parse(addresses) : undefined,
                quickLinks: quickLinks ? JSON.parse(quickLinks) : undefined,
                exhibitionLinks: exhibitionLinks ? JSON.parse(exhibitionLinks) : undefined,
                availableTdsRates: availableTdsRates ? (typeof availableTdsRates === 'string' ? JSON.parse(availableTdsRates) : availableTdsRates) : undefined,
                msmeLogos: msmeLogos ? JSON.parse(msmeLogos) : undefined,
                isMsmeLogoActive: isMsmeLogoActive === 'true' || isMsmeLogoActive === true,
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

            // Handle file uploads
            if (req.files) {
                if (req.files.logo) {
                    updateData.logo = `/uploads/settings/${req.files.logo[0].filename}`;
                }
                if (req.files.exhibitorBrochurePdf) {
                    updateData.exhibitorBrochurePdf = `/uploads/settings/${req.files.exhibitorBrochurePdf[0].filename}`;
                }
                if (req.files.domesticRegistrationFormPdf) {
                    updateData.domesticRegistrationFormPdf = `/uploads/settings/${req.files.domesticRegistrationFormPdf[0].filename}`;
                }
                if (req.files.internationalRegistrationFormPdf) {
                    updateData.internationalRegistrationFormPdf = `/uploads/settings/${req.files.internationalRegistrationFormPdf[0].filename}`;
                }
                if (req.files.sponsorshipDeckPdf) {
                    updateData.sponsorshipDeckPdf = `/uploads/settings/${req.files.sponsorshipDeckPdf[0].filename}`;
                }
                if (req.files.authorizedSignature) {
                    updateData.authorizedSignature = `/uploads/settings/${req.files.authorizedSignature[0].filename}`;
                }
                if (req.files.companyStamp) {
                    updateData.companyStamp = `/uploads/settings/${req.files.companyStamp[0].filename}`;
                }
                // Handle single MSME logo file upload
                if (req.files.msmeLogoFile && req.files.msmeLogoFile.length > 0) {
                    // Return the uploaded file path in a special field
                    updateData.uploadedMsmeLogoPath = `/uploads/settings/${req.files.msmeLogoFile[0].filename}`;
                }
            }

            const data = await settingsService.updateSettings(updateData);
            
            // If a file was uploaded, return the path in response
            const response = { success: true, data, message: 'Settings updated successfully' };
            if (updateData.uploadedMsmeLogoPath) {
                response.uploadedMsmeLogoPath = updateData.uploadedMsmeLogoPath;
            }
            
            res.json(response);
        } catch (error) {
            console.error('Update settings error:', error);
            res.status(500).json({ success: false, message: 'Server error' });
        }
    }
}

module.exports = new SettingsController();
