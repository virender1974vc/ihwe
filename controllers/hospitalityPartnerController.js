const hospitalityPartnerService = require('../services/hospitalityPartnerService');
const { logActivity } = require('../utils/logger');

class HospitalityPartnerController {
    /**
     * Get hospitality partner data.
     */
    async getData(req, res) {
        try {
            const data = await hospitalityPartnerService.getData();
            res.json({ success: true, data });
        } catch (error) {
            console.error('Fetch hospitality partner error:', error);
            res.status(500).json({ success: false, message: 'Server error' });
        }
    }

    /**
     * Update hospitality partner text data.
     */
    async updateData(req, res) {
        try {
            const data = await hospitalityPartnerService.updateData(req.body);
            try {
                await logActivity(req, 'Updated', 'Hospitality Partner', 'Updated Hospitality Partner content');
            } catch (err) {
                console.error('Activity log error:', err);
            }
            res.json({ success: true, data, message: 'Hospitality partner updated successfully' });
        } catch (error) {
            console.error('Update hospitality partner error:', error);
            res.status(500).json({ success: false, message: 'Server error' });
        }
    }

    /**
     * Upload and update hospitality partner photo.
     */
    async uploadPhoto(req, res) {
        try {
            if (!req.file) {
                return res.status(400).json({ success: false, message: 'Please upload an image file' });
            }

            const photoPath = req.file.path;

            try {
                await logActivity(req, 'Updated', 'Hospitality Partner', `Uploaded new image`);
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

module.exports = new HospitalityPartnerController();
