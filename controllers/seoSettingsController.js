const seoSettingsService = require('../services/seoSettingsService');
const path = require('path');
const fs = require('fs');

/**
 * Controller to handle SEO Settings requests.
 */
class SeoSettingsController {
    /**
     * Get advanced SEO settings.
     */
    async getAdvancedSettings(req, res) {
        try {
            const data = await seoSettingsService.getAdvancedSettings();
            res.json({ success: true, data });
        } catch (error) {
            console.error('Advanced SEO Fetch error:', error);
            res.status(500).json({ success: false, message: 'Server error' });
        }
    }

    /**
     * Update global scripts.
     */
    async updateScripts(req, res) {
        try {
            const { headerScripts, footerScripts } = req.body;
            await seoSettingsService.updateScripts(headerScripts, footerScripts);
            res.json({ success: true, message: 'Global scripts updated' });
        } catch (error) {
            console.error('Scripts update error:', error);
            res.status(500).json({ success: false, message: 'Server error' });
        }
    }

    /**
     * Upload SEO file.
     */
    async uploadFile(req, res) {
        try {
            if (!req.file) {
                return res.status(400).json({ success: false, message: 'No file uploaded' });
            }

            const fileData = {
                originalName: req.file.originalname,
                filename: req.file.filename,
                path: `/uploads/seo-files/${req.file.filename}`,
                mimetype: req.file.mimetype,
                size: req.file.size
            };

            const data = await seoSettingsService.uploadFile(fileData);
            res.json({ success: true, message: 'File uploaded', data });
        } catch (error) {
            console.error('File upload error:', error);
            res.status(500).json({ success: false, message: 'Server error' });
        }
    }

    /**
     * Delete SEO file.
     */
    async deleteFile(req, res) {
        try {
            const file = await seoSettingsService.getFileById(req.params.id);
            if (!file) {
                return res.status(404).json({ success: false, message: 'File not found' });
            }

            // Remove from physical storage
            const filePath = path.join(__dirname, '../../', file.path); // Adjusted path
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }

            const data = await seoSettingsService.deleteFile(req.params.id);
            res.json({ success: true, message: 'File deleted', data });
        } catch (error) {
            console.error('File delete error:', error);
            res.status(error.status || 500).json({ success: false, message: error.message || 'Server error' });
        }
    }
}

module.exports = new SeoSettingsController();
