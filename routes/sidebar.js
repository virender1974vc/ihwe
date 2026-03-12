const express = require('express');
const router = express.Router();
const SidebarItem = require('../models/SidebarItem');

// GET /api/sidebar - get full sidebar tree
router.get('/', async (req, res) => {
    try {
        // Fetch all top-level items (no parent), sorted by order
        const items = await SidebarItem.find({ parentId: null, isActive: true })
            .sort({ order: 1 })
            .lean();

        // For each item, recursively fetch children
        const buildTree = async (items) => {
            const result = [];
            for (const item of items) {
                const children = await SidebarItem.find({ parentId: item._id, isActive: true })
                    .sort({ order: 1 })
                    .lean();

                if (children.length > 0) {
                    item.children = await buildTree(children);
                } else {
                    item.children = [];
                }
                result.push(item);
            }
            return result;
        };

        const tree = await buildTree(items);
        res.json(tree);
    } catch (error) {
        console.error('Sidebar fetch error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// POST /api/sidebar - create sidebar item (admin use)
router.post('/', async (req, res) => {
    try {
        const item = new SidebarItem(req.body);
        await item.save();
        res.status(201).json(item);
    } catch (error) {
        console.error('Sidebar create error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
