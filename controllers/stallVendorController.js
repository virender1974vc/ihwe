const stallVendorService = require('../services/stallVendorService');
const { logActivity } = require('../utils/logger');

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
            await logActivity(req, 'Updated', 'Stall Vendor', 'Updated stall vendor section headings');
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
            await logActivity(req, 'Created', 'Stall Vendor', `Added new stall vendor: ${req.body.title || 'Untitled'}`);
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
            await logActivity(req, 'Updated', 'Stall Vendor', `Updated stall vendor: ${req.body.title || 'ID: ' + req.params.id}`);
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
            await logActivity(req, 'Deleted', 'Stall Vendor', `Deleted stall vendor card ID: ${req.params.id}`);
            res.json({ success: true, message: 'Card deleted' });
        } catch (error) {
            res.status(error.status || 500).json({ success: false, message: error.message || 'Server error' });
        }
    }
}

module.exports = new StallVendorController();
