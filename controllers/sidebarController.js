const sidebarService = require('../services/sidebarService');

/**
 * Controller to handle Sidebar requests.
 */
class SidebarController {
    /**
     * Get full sidebar tree.
     */
    async getSidebarTree(req, res) {
        try {
            const data = await sidebarService.getSidebarTree();
            res.json(data);
        } catch (error) {
            console.error('Sidebar fetch error:', error);
            res.status(500).json({ message: 'Server error' });
        }
    }

    /**
     * Create sidebar item.
     */
    async createItem(req, res) {
        try {
            const data = await sidebarService.createItem(req.body);
            res.status(201).json(data);
        } catch (error) {
            console.error('Sidebar create error:', error);
            res.status(500).json({ message: 'Server error' });
        }
    }
}

module.exports = new SidebarController();
