const travelPartnerService = require('../services/travelPartnerService');
const { logActivity } = require('../utils/logger');

class TravelPartnerController {
    /**
     * Get travel partner data.
     */
    async getData(req, res) {
        try {
            const data = await travelPartnerService.getTravelPartner();
            res.json({ success: true, data });
        } catch (error) {
            console.error('Fetch travel partner error:', error);
            res.status(500).json({ success: false, message: 'Server error' });
        }
    }

    /**
     * Update travel partner text data.
     */
    async updateData(req, res) {
        try {
            const data = await travelPartnerService.updateTravelPartner(req.body);
            try {
                await logActivity(req, 'Updated', 'Travel Partner', 'Updated Travel Partner content');
            } catch (err) {
                console.error('Activity log error:', err);
            }
            res.json({ success: true, data, message: 'Travel partner updated successfully' });
        } catch (error) {
            console.error('Update travel partner error:', error);
            res.status(500).json({ success: false, message: 'Server error' });
        }
    }

    /**
     * Upload and update hero or footer photo.
     */
    async uploadPhoto(req, res) {
        try {
            if (!req.file) {
                return res.status(400).json({ success: false, message: 'Please upload an image file' });
            }

            const { type } = req.body; // 'hero' or 'footer'
            const photoPath = `/uploads/travelpartner/${req.file.filename}`;
            
            let data;
            if (type === 'hero') {
                data = await travelPartnerService.updateHeroImage(photoPath);
            } else if (type === 'footer') {
                data = await travelPartnerService.updateFooterImage(photoPath);
            } else {
                return res.status(400).json({ success: false, message: 'Invalid image type specified' });
            }

            try {
                await logActivity(req, 'Updated', 'Travel Partner', `Uploaded new ${type} image`);
            } catch (err) {
                console.error('Activity log error:', err);
            }

            res.json({ success: true, photoPath, data, message: `${type} image uploaded successfully` });
        } catch (error) {
            console.error('Upload image error:', error);
            res.status(500).json({ success: false, message: 'Server error' });
        }
    }
}

module.exports = new TravelPartnerController();
