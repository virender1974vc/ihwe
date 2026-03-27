const galleryService = require('../services/galleryService');

/**
 * Controller to handle Gallery requests.
 */
class GalleryController {
    /**
     * Get all gallery items.
     */
    async getAllItems(req, res) {
        try {
            const { category } = req.query;
            const data = await galleryService.getAllItems(category);
            res.json({ success: true, data });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    /**
     * Add new gallery item.
     */
    async createItem(req, res) {
        try {
            const data = await galleryService.createItem(req.body);
            res.json({ success: true, data });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    /**
     * Update gallery item.
     */
    async updateItem(req, res) {
        try {
            const data = await galleryService.updateItem(req.params.id, req.body);
            res.json({ success: true, data });
        } catch (error) {
            res.status(error.status || 500).json({ success: false, message: error.message });
        }
    }

    /**
     * Delete gallery item.
     */
    async deleteItem(req, res) {
        try {
            await galleryService.deleteItem(req.params.id);
            res.json({ success: true, message: "Item deleted successfully" });
        } catch (error) {
            res.status(error.status || 500).json({ success: false, message: error.message });
        }
    }

    /**
     * Handle file upload.
     */
    async uploadFile(req, res) {
        try {
            if (!req.file) {
                return res.status(400).json({ success: false, message: "No file uploaded" });
            }
            const isVideo = req.file.mimetype.startsWith('video/');
            const relativePath = isVideo 
                ? `/uploads/gallery/videos/${req.file.filename}`
                : `/uploads/gallery/images/${req.file.filename}`;
            res.json({ success: true, url: relativePath });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
}

module.exports = new GalleryController();
