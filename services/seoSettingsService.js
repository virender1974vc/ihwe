const Settings = require('../models/Settings');
const SeoFile = require('../models/SeoFile');

/**
 * Service to handle SEO Settings operations.
 */
class SeoSettingsService {
    /**
     * Get advanced settings.
     */
    async getAdvancedSettings() {
        let settings = await Settings.findOne();
        if (!settings) settings = new Settings({});
        
        const seoFiles = await SeoFile.find().sort({ createdAt: -1 });
        
        return {
            headerScripts: settings.headerScripts || '',
            footerScripts: settings.footerScripts || '',
            seoFiles
        };
    }

    /**
     * Update global scripts.
     */
    async updateScripts(headerScripts, footerScripts) {
        let settings = await Settings.findOne();
        if (!settings) settings = new Settings({});
        
        settings.headerScripts = headerScripts;
        settings.footerScripts = footerScripts;
        
        return await settings.save();
    }

    /**
     * Upload SEO file.
     */
    async uploadFile(fileData) {
        // Delete existing file with same name if exists in DB
        await SeoFile.findOneAndDelete({ originalName: fileData.originalName });

        const seoFile = new SeoFile(fileData);
        await seoFile.save();
        
        return await SeoFile.find().sort({ createdAt: -1 });
    }

    /**
     * Get file by ID.
     */
    async getFileById(id) {
        return await SeoFile.findById(id);
    }

    /**
     * Delete SEO file.
     */
    async deleteFile(id) {
        const file = await SeoFile.findByIdAndDelete(id);
        if (!file) throw { status: 404, message: 'File not found' };
        
        return await SeoFile.find().sort({ createdAt: -1 });
    }
}

module.exports = new SeoSettingsService();
