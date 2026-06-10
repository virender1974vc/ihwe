const fabricationPartnerService = require('../../services/exhibitor_seller/fabricationPartnerService');
const { logActivity } = require('../../utils/logger');

class FabricationPartnerController {
    /**
     * Get fabrication partner data.
     */
    async getData(req, res) {
        try {
            const data = await fabricationPartnerService.getFabricationPartner();
            res.json({ success: true, data });
        } catch (error) {
            console.error('Fetch fabrication partner error:', error);
            res.status(500).json({ success: false, message: 'Server error' });
        }
    }

    /**
     * Update fabrication partner text data.
     */
    async updateData(req, res) {
        try {
            const data = await fabricationPartnerService.updateFabricationPartner(req.body);
            try {
                await logActivity(req, 'Updated', 'Fabrication Partner', 'Updated Fabrication Partner content');
            } catch (err) {
                console.error('Activity log error:', err);
            }
            res.json({ success: true, data, message: 'Fabrication partner updated successfully' });
        } catch (error) {
            console.error('Update fabrication partner error:', error);
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
            const photoPath = `/uploads/fabricationpartner/${req.file.filename}`;
            
            let data;
            if (type === 'hero') {
                data = await fabricationPartnerService.updateHeroImage(photoPath);
            } else if (type === 'footer') {
                data = await fabricationPartnerService.updateFooterImage(photoPath);
            } else {
                return res.status(400).json({ success: false, message: 'Invalid image type specified' });
            }

            try {
                await logActivity(req, 'Updated', 'Fabrication Partner', `Uploaded new ${type} image`);
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

module.exports = new FabricationPartnerController();
