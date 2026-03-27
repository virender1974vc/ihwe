const stallVendorService = require('../services/stallVendorService');

/**
 * Controller to handle Stall Vendor requests.
 */
class StallVendorController {
    /**
     * Get all content.
     */
    async getContent(req, res) {
        try {
            const data = await stallVendorService.getContent();
            res.json({ success: true, data });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    /**
     * Get headings.
     */
    async getHeadings(req, res) {
        try {
            const data = await stallVendorService.getContent();
            res.json({ success: true, data: {
                subheading: data.subheading,
                heading: data.heading,
                highlightText: data.highlightText,
                description: data.description
            }});
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    /**
     * Update headings.
     */
    async updateHeadings(req, res) {
        try {
            const data = await stallVendorService.updateHeadings(req.body);
            res.json({ success: true, data });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    /**
     * Add card.
     */
    async addCard(req, res) {
        try {
            const data = await stallVendorService.addCard(req.body);
            res.json({ success: true, data });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    /**
     * Update card.
     */
    async updateCard(req, res) {
        try {
            const data = await stallVendorService.updateCard(req.params.id, req.body);
            res.json({ success: true, data });
        } catch (error) {
            res.status(error.status || 500).json({ success: false, message: error.message || 'Server error' });
        }
    }

    /**
     * Delete card.
     */
    async deleteCard(req, res) {
        try {
            await stallVendorService.deleteCard(req.params.id);
            res.json({ success: true, message: 'Card deleted' });
        } catch (error) {
            res.status(error.status || 500).json({ success: false, message: error.message || 'Server error' });
        }
    }
}

module.exports = new StallVendorController();
