const globalPlatformService = require('../services/globalPlatformService');

/**
 * Controller to handle Global Platform section requests.
 */
class GlobalPlatformController {
    /**
     * Get Global Platform data.
     */
    async getGlobalPlatformData(req, res) {
        try {
            const data = await globalPlatformService.getGlobalPlatformData();
            res.json({ success: true, data });
        } catch (error) {
            console.error('Fetch global-platform error:', error);
            res.status(500).json({ success: false, message: 'Server error' });
        }
    }

    /**
     * Update Global Platform data.
     */
    async updateGlobalPlatform(req, res) {
        try {
            const data = await globalPlatformService.updateGlobalPlatform(req.body);
            res.json({ success: true, data, message: 'Global Platform content updated successfully' });
        } catch (error) {
            console.error('Update global-platform error:', error);
            res.status(500).json({ success: false, message: 'Server error' });
        }
    }

    /**
     * Handle image upload.
     */
    async uploadImage(req, res) {
        try {
            if (!req.file) return res.status(400).json({ success: false, message: 'Please upload an image' });
            const imageUrl = `/uploads/global-platform/${req.file.filename}`;
            res.json({ success: true, imageUrl, message: 'Image uploaded successfully' });
        } catch (error) {
            console.error('Upload error:', error);
            res.status(500).json({ success: false, message: 'Server error' });
        }
    }
}

module.exports = new GlobalPlatformController();
