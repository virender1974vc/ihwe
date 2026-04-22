const Settings = require('../models/Settings');

/**
 * Service to handle Settings operations.
 */
class SettingsService {
    /**
     * Get settings, creates default if none exists.
     */
    async getSettings() {
        let settings = await Settings.findOne();
        if (!settings) {
            settings = await new Settings({}).save();
        }
        return settings;
    }

    /**
     * Update settings.
     */
    async updateSettings(updateData) {
        let settings = await Settings.findOne();
        if (!settings) settings = new Settings({});

        const { 
            logo, exhibitorBrochurePdf, emails, phones, addresses, mapIframe, 
            marqueeText, topbarDate, supportDeskText, 
            onlineAdvancePercentage, manualAdvancePercentage, 
            quickLinks, exhibitionLinks,
            companyName, companyAddress, companyGst, companyCin,
            fullPaymentDiscount, availableTdsRates,
            authorizedSignature, companyStamp
        } = updateData;

        if (logo) settings.logo = logo;
        if (exhibitorBrochurePdf) settings.exhibitorBrochurePdf = exhibitorBrochurePdf;
        if (emails) settings.emails = emails;
        if (phones) settings.phones = phones;
        if (addresses) settings.addresses = addresses;
        if (quickLinks) settings.quickLinks = quickLinks;
        if (exhibitionLinks) settings.exhibitionLinks = exhibitionLinks;
        if (mapIframe !== undefined) settings.mapIframe = mapIframe;
        if (marqueeText !== undefined) settings.marqueeText = marqueeText;
        if (topbarDate !== undefined) settings.topbarDate = topbarDate;
        if (supportDeskText !== undefined) settings.supportDeskText = supportDeskText;
        if (onlineAdvancePercentage !== undefined) settings.onlineAdvancePercentage = onlineAdvancePercentage;
        if (manualAdvancePercentage !== undefined) settings.manualAdvancePercentage = manualAdvancePercentage;
        
        // Financials
        if (companyName !== undefined) settings.companyName = companyName;
        if (companyAddress !== undefined) settings.companyAddress = companyAddress;
        if (companyGst !== undefined) settings.companyGst = companyGst;
        if (companyCin !== undefined) settings.companyCin = companyCin;
        if (fullPaymentDiscount !== undefined) settings.fullPaymentDiscount = fullPaymentDiscount;
        if (availableTdsRates !== undefined) settings.availableTdsRates = availableTdsRates;
        if (authorizedSignature) settings.authorizedSignature = authorizedSignature;
        if (companyStamp) settings.companyStamp = companyStamp;

        return await settings.save();
    }
}

module.exports = new SettingsService();
