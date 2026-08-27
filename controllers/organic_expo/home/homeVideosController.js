const HomeVideos = require('../../../models/organic_expo/home/HomeVideos');
const path = require('path');
const fs = require('fs');

class HomeVideosController {
    async getVideos(req, res) {
        try {
            let data = await HomeVideos.findOne();
            if (!data) {
                data = await HomeVideos.create({});
            }
            res.json({ success: true, data });
        } catch (error) {
            console.error('Fetch HomeVideos error:', error);
            res.status(500).json({ success: false, message: 'Server error' });
        }
    }

    async updateVideos(req, res) {
        try {
            let updateData = { ...req.body };
            
            // Parse nested JSON strings if they come from formData
            if (typeof updateData.videos === 'string') {
                updateData.videos = JSON.parse(updateData.videos);
            }

            // Handle file uploads for thumbnails dynamically
            if (req.files && Array.isArray(req.files)) {
                req.files.forEach(file => {
                    // Match field names like 'thumbnail_0', 'thumbnail_1'
                    const match = file.fieldname.match(/^thumbnail_(\d+)$/);
                    if (match) {
                        const index = parseInt(match[1], 10);
                        if (updateData.videos && updateData.videos[index]) {
                            updateData.videos[index].thumbnail = `/uploads/organic_expo/${file.filename}`;
                        }
                    }
                });
            }

            const data = await HomeVideos.findOneAndUpdate({}, updateData, { new: true, upsert: true });
            res.json({ success: true, data, message: 'Home Videos updated successfully' });
        } catch (error) {
            console.error('Update HomeVideos error:', error);
            res.status(500).json({ success: false, message: 'Server error' });
        }
    }
}

module.exports = new HomeVideosController();
