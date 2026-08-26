const BeyondExhibition = require('../../../models/organic_expo/home/BeyondExhibition');
const path = require('path');
const fs = require('fs');

class BeyondExhibitionController {
    async getBeyondExhibition(req, res) {
        try {
            let data = await BeyondExhibition.findOne();
            if (!data) {
                data = await BeyondExhibition.create({});
            }
            res.json({ success: true, data });
        } catch (error) {
            console.error('Fetch BeyondExhibition error:', error);
            res.status(500).json({ success: false, message: 'Server error' });
        }
    }

    async updateBeyondExhibition(req, res) {
        try {
            let updateData = { ...req.body };
            
            // Parse nested JSON strings if they come from formData
            if (typeof updateData.extras === 'string') {
                updateData.extras = JSON.parse(updateData.extras);
            }

            // Handle file upload for image
            if (req.files && req.files.image && req.files.image[0]) {
                updateData.image = `/uploads/organic_expo/${req.files.image[0].filename}`;
            }

            const data = await BeyondExhibition.findOneAndUpdate({}, updateData, { new: true, upsert: true });
            res.json({ success: true, data, message: 'Beyond Exhibition updated successfully' });
        } catch (error) {
            console.error('Update BeyondExhibition error:', error);
            res.status(500).json({ success: false, message: 'Server error' });
        }
    }
}

module.exports = new BeyondExhibitionController();
