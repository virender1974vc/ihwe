const exhibitorProfileService = require('../services/exhibitorProfileService');

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
            res.json(data);
        } catch (error) {
            res.status(error.status || 400).json({ message: error.message });
        }
    }
}

module.exports = new ExhibitorProfileController();
