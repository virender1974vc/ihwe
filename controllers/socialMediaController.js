const socialMediaService = require('../services/socialMediaService');
const { logActivity } = require('../utils/logger');

/**
 * Controller to handle Social Media requests.
 */
class SocialMediaController {
    /**
     * Get social media links.
     */
    async getSocialMedia(req, res) {
        try {
            const data = await socialMediaService.getSocialMedia();
            res.json({ success: true, data });
        } catch (error) {
            console.error('Error fetching social media:', error);
            res.status(500).json({ success: false, message: 'Server error' });
        }
    }

    /**
     * Update social media links.
     */
    async updateSocialMedia(req, res) {
        try {
            const data = await socialMediaService.updateSocialMedia(req.body);
            await logActivity(req, 'Updated', 'Social Media', 'Updated social media links');
            res.json({ success: true, message: 'Social media updated successfully', data });
        } catch (error) {
            console.error('Error updating social media:', error);
            res.status(500).json({ success: false, message: 'Server error' });
        }
    }
}

module.exports = new SocialMediaController();
