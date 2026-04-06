const aboutService = require('../services/aboutService');
const { logActivity } = require('../utils/logger');

/**
 * Controller to handle About section requests.
 */
class AboutController {
    /**
     * Get about data.
     */
    async getAboutData(req, res) {
        try {
            const data = await aboutService.getAboutData();
            res.json({ success: true, data });
        } catch (error) {
            console.error('Fetch about error:', error);
            res.status(500).json({ success: false, message: 'Server error' });
        }
    }

    /**
     * Update about text data.
     */
    async updateAboutText(req, res) {
        try {
            const data = await aboutService.updateAboutText(req.body);
            await logActivity(req, 'Updated', 'About Us', 'Updated About Us content');
            res.json({ success: true, data, message: 'About content updated successfully' });
        } catch (error) {
            console.error('Update about error:', error);
            res.status(500).json({ success: false, message: 'Server error' });
        }
    }

    /**
     * Upload and update about images.
     */
    async updateAboutImages(req, res) {
        try {
            if (!req.files) return res.status(400).json({ success: false, message: 'Please upload image files' });
            
            const imagePaths = {};
            if (req.files.image1) imagePaths.image1 = `/uploads/about/${req.files.image1[0].filename}`;
            if (req.files.image2) imagePaths.image2 = `/uploads/about/${req.files.image2[0].filename}`;
            if (req.files.image3) imagePaths.image3 = `/uploads/about/${req.files.image3[0].filename}`;
            
            if (Object.keys(imagePaths).length === 0) {
                return res.status(400).json({ success: false, message: 'No images were uploaded' });
            }

            await aboutService.updateAboutImages(imagePaths);
            await logActivity(req, 'Updated', 'About Us', 'Updated About Us section images');
            res.json({ success: true, imagePaths, message: 'Images uploaded successfully' });
        } catch (error) {
            console.error('Upload images error:', error);
            res.status(500).json({ success: false, message: 'Server error' });
        }
    }
}

module.exports = new AboutController();
