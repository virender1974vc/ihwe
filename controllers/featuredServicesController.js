const featuredServicesService = require('../services/featuredServicesService');

/**
 * Controller to handle Featured Services section requests.
 */
class FeaturedServicesController {
    /**
     * Get all featured services.
     */
    async getFeaturedServices(req, res) {
        try {
            const data = await featuredServicesService.getFeaturedServices();
            res.json({ success: true, data });
        } catch (error) {
            console.error('Fetch featured services error:', error);
            res.status(500).json({ success: false, message: 'Server error' });
        }
    }

    /**
     * Update section headings.
     */
    async updateHeadings(req, res) {
        try {
            const data = await featuredServicesService.updateHeadings(req.body);
            res.json({ success: true, data, message: 'Headings updated successfully' });
        } catch (error) {
            console.error('Update headings error:', error);
            res.status(500).json({ success: false, message: 'Server error' });
        }
    }

    /**
     * Add a service card.
     */
    async addCard(req, res) {
        try {
            const data = await featuredServicesService.addCard(req.body);
            res.json({ success: true, data, message: 'Card added successfully' });
        } catch (error) {
            console.error('Add card error:', error);
            res.status(500).json({ success: false, message: 'Server error' });
        }
    }

    /**
     * Update a service card.
     */
    async updateCard(req, res) {
        try {
            const data = await featuredServicesService.updateCard(req.params.cardId, req.body);
            res.json({ success: true, data, message: 'Card updated successfully' });
        } catch (error) {
            console.error('Update card error:', error);
            res.status(error.status || 500).json({ success: false, message: error.message || 'Server error' });
        }
    }

    /**
     * Delete a service card.
     */
    async deleteCard(req, res) {
        try {
            await featuredServicesService.deleteCard(req.params.cardId);
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
            const imageUrl = `/uploads/featured-services/${req.file.filename}`;
            res.json({ success: true, imageUrl, message: 'Image uploaded successfully' });
        } catch (error) {
            console.error('Upload error:', error);
            res.status(500).json({ success: false, message: 'Server error' });
        }
    }
}

module.exports = new FeaturedServicesController();
