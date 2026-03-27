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

        const { logo, emails, phones, addresses, mapIframe, marqueeText, topbarDate } = updateData;

        if (logo) settings.logo = logo;
        if (emails) settings.emails = emails;
        if (phones) settings.phones = phones;
        if (addresses) settings.addresses = addresses;
        if (mapIframe !== undefined) settings.mapIframe = mapIframe;
        if (marqueeText !== undefined) settings.marqueeText = marqueeText;
        if (topbarDate !== undefined) settings.topbarDate = topbarDate;

        return await settings.save();
    }
}

module.exports = new SettingsService();
