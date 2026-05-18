const chairmanMessageService = require('../services/chairmanMessageService');
const { logActivity } = require('../utils/logger');

class ChairmanMessageController {
    /**
     * Get chairman message data.
     */
    async getData(req, res) {
        try {
            const data = await chairmanMessageService.getChairmanMessage();
            res.json({ success: true, data });
        } catch (error) {
            console.error('Fetch chairman message error:', error);
            res.status(500).json({ success: false, message: 'Server error' });
        }
    }

    /**
     * Update chairman message text data.
     */
    async updateText(req, res) {
        try {
            const data = await chairmanMessageService.updateChairmanMessage(req.body);
            try {
                await logActivity(req, 'Updated', 'Chairman Message', 'Updated Advisory Chairman Message content');
            } catch (err) {
                console.error('Activity log error:', err);
            }
            res.json({ success: true, data, message: 'Chairman message updated successfully' });
        } catch (error) {
            console.error('Update chairman message error:', error);
            res.status(500).json({ success: false, message: 'Server error' });
        }
    }

    /**
     * Upload and update chairman photo.
     */
    async uploadPhoto(req, res) {
        try {
            if (!req.file) {
                return res.status(400).json({ success: false, message: 'Please upload a photo file' });
            }

            const photoPath = `/uploads/advisory/${req.file.filename}`;
            const data = await chairmanMessageService.updateChairmanPhoto(photoPath);

            try {
                await logActivity(req, 'Updated', 'Chairman Message', 'Uploaded new Advisory Chairman photo');
            } catch (err) {
                console.error('Activity log error:', err);
            }

            res.json({ success: true, photoPath, data, message: 'Chairman photo uploaded successfully' });
        } catch (error) {
            console.error('Upload chairman photo error:', error);
            res.status(500).json({ success: false, message: 'Server error' });
        }
    }
}

module.exports = new ChairmanMessageController();
