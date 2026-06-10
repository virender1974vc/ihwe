const hotelStayPartnerService = require('../../services/exhibitor_seller/hotelStayPartnerService');
const { logActivity } = require('../../utils/logger');

class HotelStayPartnerController {
    /**
     * Get hotel stay partner data.
     */
    async getData(req, res) {
        try {
            const data = await hotelStayPartnerService.getHotelStayPartner();
            res.json({ success: true, data });
        } catch (error) {
            console.error('Fetch hotel stay partner error:', error);
            res.status(500).json({ success: false, message: 'Server error' });
        }
    }

    /**
     * Update hotel stay partner text data.
     */
    async updateData(req, res) {
        try {
            const data = await hotelStayPartnerService.updateHotelStayPartner(req.body);
            try {
                await logActivity(req, 'Updated', 'Hotel Stay Partner', 'Updated Hotel Stay Partner content');
            } catch (err) {
                console.error('Activity log error:', err);
            }
            res.json({ success: true, data, message: 'Hotel stay partner updated successfully' });
        } catch (error) {
            console.error('Update hotel stay partner error:', error);
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
            const photoPath = `/uploads/hotelstaypartner/${req.file.filename}`;
            
            let data;
            if (type === 'hero') {
                data = await hotelStayPartnerService.updateHeroImage(photoPath);
            } else if (type === 'footer') {
                data = await hotelStayPartnerService.updateFooterImage(photoPath);
            } else {
                return res.status(400).json({ success: false, message: 'Invalid image type specified' });
            }

            try {
                await logActivity(req, 'Updated', 'Hotel Stay Partner', `Uploaded new ${type} image`);
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

module.exports = new HotelStayPartnerController();
