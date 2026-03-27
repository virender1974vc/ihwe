const SidebarItem = require('../models/SidebarItem');

/**
 * Service to handle Sidebar operations.
 */
class SidebarService {
    /**
     * Get full sidebar tree.
     */
    async getSidebarTree() {
        // Fetch all top-level items (no parent), sorted by order
        const items = await SidebarItem.find({ parentId: null, isActive: true })
            .sort({ order: 1 })
            .lean();

        return await this.buildTree(items);
    }

    /**
     * Recursively build tree.
     */
    async buildTree(items) {
        const result = [];
        for (const item of items) {
            const children = await SidebarItem.find({ parentId: item._id, isActive: true })
                .sort({ order: 1 })
                .lean();

            if (children.length > 0) {
                item.children = await this.buildTree(children);
            } else {
                item.children = [];
            }
            result.push(item);
        }
        return result;
    }

    /**
     * Create sidebar item.
     */
    async createItem(data) {
        const item = new SidebarItem(data);
        return await item.save();
    }
}

module.exports = new SidebarService();
