const clientService = require('../services/clientService');
const { logActivity } = require('../utils/logger');

/**
 * Controller to handle Client section requests.
 */
class ClientController {
    /**
     * Get all client data.
     */
    async getClientData(req, res) {
        try {
            const data = await clientService.getClientData();
            res.json({ success: true, data });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    /**
     * Update headings.
     */
    async updateHeadings(req, res) {
        try {
            const data = await clientService.updateHeadings(req.body);
            await logActivity(req, 'Updated', 'Our Clients', 'Updated client section headings');
            res.json({ success: true, data });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    /**
     * Add image card.
     */
    async addImage(req, res) {
        try {
            const data = await clientService.addImage(req.body);
            await logActivity(req, 'Created', 'Our Clients', `Added new client image: ${req.body.altText || 'Untitled'}`);
            res.json({ success: true, data });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    /**
     * Update image card.
     */
    async updateImage(req, res) {
        try {
            const data = await clientService.updateImage(req.params.imageId, req.body);
            res.json({ success: true, data });
        } catch (error) {
            res.status(error.status || 500).json({ success: false, message: error.message });
        }
    }

    /**
     * Delete image card.
     */
    async deleteImage(req, res) {
        try {
            const data = await clientService.deleteImage(req.params.imageId);
            await logActivity(req, 'Deleted', 'Our Clients', `Deleted client image ID: ${req.params.imageId}`);
            res.json({ success: true, data });
        } catch (error) {
            res.status(error.status || 500).json({ success: false, message: error.message });
        }
    }

    /**
     * Handle image upload.
     */
    async uploadImage(req, res) {
        try {
            if (!req.file) {
                return res.status(400).json({ success: false, message: "No file uploaded" });
            }
            const relativePath = `/uploads/clients/${req.file.filename}`;
            res.json({ success: true, url: relativePath });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
}

module.exports = new ClientController();
