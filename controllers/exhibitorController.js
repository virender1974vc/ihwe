const exhibitorService = require('../services/exhibitorService');
const fs = require('fs');

/**
 * Controller to handle Exhibitor requests.
 */
class ExhibitorController {
    /**
     * Get all exhibitors.
     */
    async getAllExhibitors(req, res) {
        try {
            const data = await exhibitorService.getAllExhibitors();
            res.json({ success: true, data });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    /**
     * Add new exhibitor.
     */
    async addExhibitor(req, res) {
        try {
            const { title, location, websiteUrl, altText } = req.body;
            if (!req.file) {
                return res.status(400).json({ success: false, message: 'Image is required' });
            }

            const exhibitorData = {
                title,
                location,
                websiteUrl,
                image: req.file.path,
                altText: altText || title
            };

            const data = await exhibitorService.addExhibitor(exhibitorData);
            res.status(201).json({ success: true, message: 'Exhibitor added successfully', data });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    /**
     * Update exhibitor.
     */
    async updateExhibitor(req, res) {
        try {
            const { title, location, websiteUrl, altText } = req.body;
            let updateData = { title, location, websiteUrl, altText };

            if (req.file) {
                updateData.image = req.file.path;
                const oldExhibitor = await exhibitorService.getExhibitorById(req.params.id);
                if (oldExhibitor && oldExhibitor.image && fs.existsSync(oldExhibitor.image)) {
                    fs.unlinkSync(oldExhibitor.image);
                }
            }

            const data = await exhibitorService.updateExhibitor(req.params.id, updateData);
            res.json({ success: true, message: 'Exhibitor updated successfully', data });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    /**
     * Delete exhibitor.
     */
    async deleteExhibitor(req, res) {
        try {
            const exhibitor = await exhibitorService.getExhibitorById(req.params.id);
            if (!exhibitor) {
                return res.status(404).json({ success: false, message: 'Exhibitor not found' });
            }

            if (exhibitor.image && fs.existsSync(exhibitor.image)) {
                fs.unlinkSync(exhibitor.image);
            }

            await exhibitorService.deleteExhibitor(req.params.id);
            res.json({ success: true, message: 'Exhibitor deleted successfully' });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
}

module.exports = new ExhibitorController();
