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
            const { category, search, page, limit } = req.query;
            console.log('Fetching exhibitors with filters:', { category, search, page, limit });
            const result = await exhibitorService.getAllExhibitors({ category, search, page, limit });

            res.json({
                success: true,
                data: result.data,
                pagination: result.pagination
            });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    /**
     * Add new exhibitor.
     */
    async addExhibitor(req, res) {
        try {
            const { title, location, websiteUrl, altText, category, order } = req.body;
            if (!req.file) {
                return res.status(400).json({ success: false, message: 'Image is required' });
            }

            const maxOrder = await exhibitorService.getMaxOrder();
            const exhibitorData = {
                title,
                location,
                category: category || 'OTHERS',
                order: order ? Number(order) : maxOrder + 1,
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
            const { title, location, websiteUrl, altText, category, order } = req.body;
            let updateData = {
                title,
                location,
                websiteUrl,
                altText,
                category,
                order: order !== undefined ? Number(order) : undefined,
                updatedAt: Date.now()
            };

            if (req.file) {
                updateData.image = `/uploads/exhibitors/${req.file.filename}`;
            }

            const data = await exhibitorService.updateExhibitor(req.params.id, updateData);
            await logActivity(req, 'Updated', 'Exhibitor List', `Updated exhibitor: ${title || 'ID: ' + req.params.id}`);
            res.json({ success: true, message: 'Exhibitor updated successfully', data });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    /**
     * Reorder exhibitors.
     */
    async reorderExhibitors(req, res) {
        try {
            const { orders, id, targetId, targetOrder, mode } = req.body;

            // If id and targetId or targetOrder are provided, use the new single reorder logic
            if (id && (targetId || targetOrder !== undefined)) {
                await exhibitorService.reorderExhibitor(id, targetId, mode || 'swap', targetOrder);
                return res.json({ success: true, message: 'Exhibitor reordered successfully' });
            }

            // Fallback to bulk reorder
            if (!orders || !Array.isArray(orders)) {
                return res.status(400).json({ success: false, message: 'Orders or id/targetId required' });
            }

            await Promise.all(orders.map(item =>
                exhibitorService.updateExhibitor(item._id, { order: item.order })
            ));

            await exhibitorService.rebalanceOrders();

            res.json({ success: true, message: 'Exhibitors reordered successfully' });
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

            // Remove physical file
            if (exhibitor.image) {
                const imagePath = exhibitor.image.startsWith('/') ? exhibitor.image.substring(1) : exhibitor.image;
                if (fs.existsSync(imagePath)) {
                    fs.unlinkSync(imagePath);
                }
            }

            await exhibitorService.deleteExhibitor(req.params.id);
            await logActivity(req, 'Deleted', 'Exhibitor List', `Deleted exhibitor: ${exhibitor.title || 'ID: ' + req.params.id}`);
            res.json({ success: true, message: 'Exhibitor deleted successfully' });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
    async bulkAddExhibitors(req, res) {
        try {
            const { category, location, altText } = req.body;
            if (!req.files || req.files.length === 0) {
                return res.status(400).json({ success: false, message: 'No images uploaded' });
            }

            const maxOrder = await exhibitorService.getMaxOrder();
            const exhibitorsData = req.files.map((file, index) => {
                // Sanitize title from filename
                const title = file.originalname.split('.')[0]
                    .replace(/[-_]/g, ' ')
                    .split(' ')
                    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                    .join(' ');

                return {
                    title: title,
                    location: location || 'India',
                    category: category || 'OTHERS',
                    image: `/uploads/exhibitors/${file.filename}`,
                    altText: altText || title,
                    order: maxOrder + index + 1
                };
            });

            // Sequential save to prevent order/ID collisions
            const results = [];
            for (const ex of exhibitorsData) {
                const saved = await exhibitorService.addExhibitor(ex);
                results.push(saved);
            }

            await logActivity(req, 'Created', 'Exhibitor List', `Bulk uploaded ${req.files.length} exhibitors to ${category || 'OTHERS'}`);

            res.status(201).json({ 
                success: true, 
                message: `Successfully added ${req.files.length} exhibitors`,
                count: results.length
            });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    /**
     * Bulk delete exhibitors.
     */
    async bulkDeleteExhibitors(req, res) {
        try {
            const { ids } = req.body;
            if (!ids || !Array.isArray(ids) || ids.length === 0) {
                return res.status(400).json({ success: false, message: 'Exhibitor IDs are required' });
            }

            let deletedCount = 0;
            for (const id of ids) {
                const exhibitor = await exhibitorService.getExhibitorById(id);
                if (exhibitor) {
                    // Try to delete image file
                    try {
                        const imagePath = exhibitor.image.startsWith('/') ? exhibitor.image.substring(1) : exhibitor.image;
                        if (fs.existsSync(imagePath)) {
                            fs.unlinkSync(imagePath);
                        }
                    } catch (err) {
                        console.error('Error deleting image file:', err);
                    }
                    await exhibitorService.deleteExhibitor(id);
                    deletedCount++;
                }
            }

            await logActivity(req, 'Deleted', 'Exhibitor List', `Bulk deleted ${deletedCount} exhibitors`);
            res.json({ success: true, message: `Successfully deleted ${deletedCount} exhibitors` });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
}

module.exports = new ExhibitorController();
