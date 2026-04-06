const exhibitorProfileService = require('../services/exhibitorProfileService');
const { logActivity } = require('../utils/logger');

/**
 * Controller to handle Exhibitor Profile requests.
 */
class ExhibitorProfileController {
    /**
     * Get all exhibitor profile data.
     */
    async getProfile(req, res) {
        try {
            const data = await exhibitorProfileService.getProfile();
            res.json(data);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }

    /**
     * Update headings and show info.
     */
    async updateMeta(req, res) {
        try {
            const data = await exhibitorProfileService.updateMeta(req.body);
            await logActivity(req, 'Updated', 'Exhibitor Profile', 'Updated exhibitor profile headings and metadata');
            res.json(data);
        } catch (error) {
            res.status(400).json({ message: error.message });
        }
    }

    /**
     * Add segment.
     */
    async addSegment(req, res) {
        try {
            const data = await exhibitorProfileService.addSegment(req.body);
            await logActivity(req, 'Created', 'Exhibitor Profile', `Added new profile segment: ${req.body.title || 'Untitled'}`);
            res.status(201).json(data);
        } catch (error) {
            res.status(400).json({ message: error.message });
        }
    }

    /**
     * Delete segment.
     */
    async deleteSegment(req, res) {
        try {
            const data = await exhibitorProfileService.deleteSegment(req.params.id);
            await logActivity(req, 'Deleted', 'Exhibitor Profile', `Deleted profile segment ID: ${req.params.id}`);
            res.json(data);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }

    /**
     * Update segment.
     */
    async updateSegment(req, res) {
        try {
            const data = await exhibitorProfileService.updateSegment(req.params.id, req.body);
            await logActivity(req, 'Updated', 'Exhibitor Profile', `Updated profile segment: ${req.body.title || 'ID: ' + req.params.id}`);
            res.json(data);
        } catch (error) {
            res.status(error.status || 400).json({ message: error.message });
        }
    }

    /**
     * Add product category.
     */
    async addCategory(req, res) {
        try {
            const data = await exhibitorProfileService.addCategory(req.body);
            await logActivity(req, 'Created', 'Exhibitor Profile', `Added new product category: ${req.body.title || 'Untitled'}`);
            res.status(201).json(data);
        } catch (error) {
            res.status(400).json({ message: error.message });
        }
    }

    /**
     * Delete product category.
     */
    async deleteCategory(req, res) {
        try {
            const data = await exhibitorProfileService.deleteCategory(req.params.id);
            await logActivity(req, 'Deleted', 'Exhibitor Profile', `Deleted product category ID: ${req.params.id}`);
            res.json(data);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }

    /**
     * Update product category.
     */
    async updateCategory(req, res) {
        try {
            const data = await exhibitorProfileService.updateCategory(req.params.id, req.body);
            await logActivity(req, 'Updated', 'Exhibitor Profile', `Updated product category: ${req.body.title || 'ID: ' + req.params.id}`);
            res.json(data);
        } catch (error) {
            res.status(error.status || 400).json({ message: error.message });
        }
    }
}

module.exports = new ExhibitorProfileController();
