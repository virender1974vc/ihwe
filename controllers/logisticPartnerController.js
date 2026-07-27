const logisticPartnerService = require('../services/logisticPartnerService');
const { logActivity } = require('../utils/logger');

class LogisticPartnerController {
    /**
     * Get logistic partner data.
     */
    async getData(req, res) {
        try {
            const data = await logisticPartnerService.getData();
            res.json({ success: true, data });
        } catch (error) {
            console.error('Fetch logistic partner error:', error);
            res.status(500).json({ success: false, message: 'Server error' });
        }
    }

    /**
     * Update logistic partner text data.
     */
    async updateData(req, res) {
        try {
            const data = await logisticPartnerService.updateData(req.body);
            try {
                await logActivity(req, 'Updated', 'Logistic Partner', 'Updated Logistic Partner content');
            } catch (err) {
                console.error('Activity log error:', err);
            }
            res.json({ success: true, data, message: 'Logistic partner updated successfully' });
        } catch (error) {
            console.error('Update logistic partner error:', error);
            res.status(500).json({ success: false, message: 'Server error' });
        }
    }

    /**
     * Upload and update logistic partner photo.
     */
    async uploadPhoto(req, res) {
        try {
            if (!req.file) {
                return res.status(400).json({ success: false, message: 'Please upload an image file' });
            }

            const photoPath = req.file.path;

            try {
                await logActivity(req, 'Updated', 'Logistic Partner', `Uploaded new image`);
            } catch (err) {
                console.error('Activity log error:', err);
            }

            res.json({ success: true, url: photoPath, message: `Image uploaded successfully` });
        } catch (error) {
            console.error('Upload image error:', error);
            res.status(500).json({ success: false, message: 'Server error' });
        }
    }
}

module.exports = new LogisticPartnerController();
