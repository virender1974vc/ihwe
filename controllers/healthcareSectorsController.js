const healthcareSectorsService = require('../services/healthcareSectorsService');
const { logActivity } = require('../utils/logger');

/**
 * Controller to handle Healthcare Sectors section requests.
 */
class HealthcareSectorsController {
    /**
     * Get all healthcare sectors.
     */
    async getHealthcareSectors(req, res) {
        try {
            const data = await healthcareSectorsService.getHealthcareSectors();
            res.json({ success: true, data });
        } catch (error) {
            console.error('Fetch healthcare sectors error:', error);
            res.status(500).json({ success: false, message: 'Server error' });
        }
    }

    /**
     * Update section headings.
     */
    async updateHeadings(req, res) {
        try {
            const data = await healthcareSectorsService.updateHeadings(req.body, req.user?.username);
            await logActivity(req, 'Updated', 'Healthcare Sectors', 'Updated section headings');
            res.json({ success: true, data, message: 'Headings updated successfully' });
        } catch (error) {
            console.error('Update headings error:', error);
            res.status(500).json({ success: false, message: 'Server error' });
        }
    }

    /**
     * Add a sector card.
     */
    async addCard(req, res) {
        try {
            const data = await healthcareSectorsService.addCard(req.body, req.user?.username);
            await logActivity(req, 'Created', 'Healthcare Sectors', `Added new sector: ${req.body.title}`);
            res.json({ success: true, data, message: 'Card added successfully' });
        } catch (error) {
            console.error('Add card error:', error);
            res.status(500).json({ success: false, message: 'Server error' });
        }
    }

    /**
     * Update a sector card.
     */
    async updateCard(req, res) {
        try {
            const data = await healthcareSectorsService.updateCard(req.params.cardId, req.body, req.user?.username);
            await logActivity(req, 'Updated', 'Healthcare Sectors', `Updated sector: ${req.body.title || 'ID: ' + req.params.cardId}`);
            res.json({ success: true, data, message: 'Card updated successfully' });
        } catch (error) {
            console.error('Update card error:', error);
            res.status(error.status || 500).json({ success: false, message: error.message || 'Server error' });
        }
    }

    /**
     * Delete a sector card.
     */
    async deleteCard(req, res) {
        try {
            await healthcareSectorsService.deleteCard(req.params.cardId, req.user?.username);
            await logActivity(req, 'Deleted', 'Healthcare Sectors', `Deleted sector ID: ${req.params.cardId}`);
            res.json({ success: true, message: 'Card deleted successfully' });
        } catch (error) {
            console.error('Delete card error:', error);
            res.status(error.status || 500).json({ success: false, message: error.message || 'Server error' });
        }
    }

    /**
     * Handle image upload.
     */
    async uploadImage(req, res) {
        try {
            if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });
            const imageUrl = `/uploads/healthcare-sectors/${req.file.filename}`;
            res.json({ success: true, imageUrl, message: 'Image uploaded successfully' });
        } catch (error) {
            console.error('Upload error:', error);
            res.status(500).json({ success: false, message: 'Server error' });
        }
    }
}

module.exports = new HealthcareSectorsController();
