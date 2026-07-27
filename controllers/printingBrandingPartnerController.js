const printingBrandingPartnerService = require('../services/printingBrandingPartnerService');
const { logActivity } = require('../utils/logger');

class PrintingBrandingPartnerController {
    /**
     * Get printing branding partner data.
     */
    async getData(req, res) {
        try {
            const data = await printingBrandingPartnerService.getData();
            res.json({ success: true, data });
        } catch (error) {
            console.error('Fetch printing branding partner error:', error);
            res.status(500).json({ success: false, message: 'Server error' });
        }
    }

    /**
     * Update printing branding partner text data.
     */
    async updateData(req, res) {
        try {
            const data = await printingBrandingPartnerService.updateData(req.body);
            try {
                await logActivity(req, 'Updated', 'Printing Branding Partner', 'Updated Printing Branding Partner content');
            } catch (err) {
                console.error('Activity log error:', err);
            }
            res.json({ success: true, data, message: 'Printing branding partner updated successfully' });
        } catch (error) {
            console.error('Update printing branding partner error:', error);
            res.status(500).json({ success: false, message: 'Server error' });
        }
    }

    /**
     * Upload and update printing branding partner photo.
     */
    async uploadPhoto(req, res) {
        try {
            if (!req.file) {
                return res.status(400).json({ success: false, message: 'Please upload an image file' });
            }

            const photoPath = req.file.path;

            try {
                await logActivity(req, 'Updated', 'Printing Branding Partner', `Uploaded new image`);
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

module.exports = new PrintingBrandingPartnerController();
