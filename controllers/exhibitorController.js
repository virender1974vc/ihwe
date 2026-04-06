const exhibitorService = require('../services/exhibitorService');
const { logActivity } = require('../utils/logger');
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
                image: `/uploads/exhibitors/${req.file.filename}`,
                altText: altText || title
            };

            const data = await exhibitorService.addExhibitor(exhibitorData);
            await logActivity(req, 'Created', 'Exhibitor List', `Added new exhibitor: ${title}`);
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
                updateData.image = `/uploads/exhibitors/${req.file.filename}`;
                const oldExhibitor = await exhibitorService.getExhibitorById(req.params.id);
                if (oldExhibitor && oldExhibitor.image && fs.existsSync(oldExhibitor.image)) {
                    fs.unlinkSync(oldExhibitor.image);
                }
            }

            const data = await exhibitorService.updateExhibitor(req.params.id, updateData);
            await logActivity(req, 'Updated', 'Exhibitor List', `Updated exhibitor: ${title || 'ID: ' + req.params.id}`);
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
            await logActivity(req, 'Deleted', 'Exhibitor List', `Deleted exhibitor: ${exhibitor.title || 'ID: ' + req.params.id}`);
            res.json({ success: true, message: 'Exhibitor deleted successfully' });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
}

module.exports = new ExhibitorController();
