const AwardsGallery = require('../models/AwardsGallery');
const { logActivity } = require('../utils/logger');

class AwardsGalleryController {
    async getAll(req, res) {
        try {
            const items = await AwardsGallery.find({ status: 'Active' }).sort({ order: 1, createdAt: -1 });
            res.json({ success: true, data: items });
        } catch (error) {
            console.error('Fetch gallery error:', error);
            res.status(500).json({ success: false, message: 'Server Error' });
        }
    }

    // GET all for admin (including inactive)
    async getAllAdmin(req, res) {
        try {
            const items = await AwardsGallery.find().sort({ order: 1, createdAt: -1 });
            res.json({ success: true, data: items });
        } catch (error) {
            console.error('Fetch gallery error:', error);
            res.status(500).json({ success: false, message: 'Server Error' });
        }
    }

    // GET single item
    async getById(req, res) {
        try {
            const item = await AwardsGallery.findById(req.params.id);
            if (!item) return res.status(404).json({ success: false, message: 'Item not found' });
            res.json({ success: true, data: item });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Server Error' });
        }
    }

    // CREATE new item
    async create(req, res) {
        try {
            const { title, label, order, status } = req.body;

            if (!req.file) {
                return res.status(400).json({ success: false, message: 'Image is required' });
            }

            const newItem = new AwardsGallery({
                title,
                image: `/uploads/awards-gallery/${req.file.filename}`,
                label: label || 'NAMO GANGE GLOBAL HEALTH EXCELLENCE AWARDS',
                order: order || 0,
                status: status || 'Active',
                updated_by: req.body.updated_by || 'Admin'
            });

            const saved = await newItem.save();
            await logActivity(req, 'Created', 'Awards Gallery', `Created gallery item: ${title}`);
            res.status(201).json({ success: true, data: saved, message: 'Gallery item created successfully' });
        } catch (error) {
            console.error('Create gallery error:', error);
            res.status(500).json({ success: false, message: 'Server Error' });
        }
    }

    // BULK CREATE items
    async bulkCreate(req, res) {
        try {
            if (!req.files || req.files.length === 0) {
                return res.status(400).json({ success: false, message: 'At least one image is required' });
            }

            const { label, status } = req.body;

            // Get the current max order to continue from there
            const maxOrderItem = await AwardsGallery.findOne().sort({ order: -1 });
            const startOrder = maxOrderItem ? maxOrderItem.order + 1 : 0;

            const items = [];

            for (let i = 0; i < req.files.length; i++) {
                const file = req.files[i];
                const newItem = new AwardsGallery({
                    title: file.originalname.replace(/\.[^/.]+$/, ''), // Use filename as title
                    image: `/uploads/awards-gallery/${file.filename}`,
                    label: label || 'NAMO GANGE GLOBAL HEALTH EXCELLENCE AWARDS',
                    order: startOrder + i, // Continue from max order
                    status: status || 'Active',
                    updated_by: req.body.updated_by || 'Admin'
                });
                items.push(newItem);
            }

            const saved = await AwardsGallery.insertMany(items);
            await logActivity(req, 'Created', 'Awards Gallery', `Bulk created ${saved.length} gallery items`);
            res.status(201).json({
                success: true,
                data: saved,
                message: `${saved.length} gallery items created successfully`
            });
        } catch (error) {
            console.error('Bulk create gallery error:', error);
            res.status(500).json({ success: false, message: 'Server Error' });
        }
    }

    // UPDATE item
    async update(req, res) {
        try {
            const { title, label, order, status } = req.body;
            const item = await AwardsGallery.findById(req.params.id);

            if (!item) return res.status(404).json({ success: false, message: 'Item not found' });

            if (title) item.title = title;
            if (label) item.label = label;
            if (order !== undefined) item.order = order;
            if (status) item.status = status;
            if (req.file) item.image = `/uploads/awards-gallery/${req.file.filename}`;
            item.updated_by = req.body.updated_by || 'Admin';

            const updated = await item.save();
            await logActivity(req, 'Updated', 'Awards Gallery', `Updated gallery item: ${title}`);
            res.json({ success: true, data: updated, message: 'Gallery item updated successfully' });
        } catch (error) {
            console.error('Update gallery error:', error);
            res.status(500).json({ success: false, message: 'Server Error' });
        }
    }

    // DELETE item
    async delete(req, res) {
        try {
            const item = await AwardsGallery.findByIdAndDelete(req.params.id);
            if (!item) return res.status(404).json({ success: false, message: 'Item not found' });

            await logActivity(req, 'Deleted', 'Awards Gallery', `Deleted gallery item: ${item.title}`);
            res.json({ success: true, message: 'Gallery item deleted successfully' });
        } catch (error) {
            console.error('Delete gallery error:', error);
            res.status(500).json({ success: false, message: 'Server Error' });
        }
    }
}

module.exports = new AwardsGalleryController();
