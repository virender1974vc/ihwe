const countersService = require('../services/countersService');

/**
 * Controller to handle Counter requests.
 */
class CountersController {
    /**
     * Get all counters.
     */
    async getAllCounters(req, res) {
        try {
            const data = await countersService.getAllCounters();
            res.json({ success: true, data });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    /**
     * Add new counter.
     */
    async createCounter(req, res) {
        try {
            const { icon, end, suffix, label, altText, overlay } = req.body;
            if (!req.file) {
                return res.status(400).json({ success: false, message: 'Background image is required' });
            }

            const counterData = {
                icon,
                end,
                suffix,
                label,
                bg: `/uploads/counters/${req.file.filename}`,
                altText,
                overlay
            };

            const data = await countersService.createCounter(counterData);
            res.status(201).json({ success: true, data });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    /**
     * Update counter.
     */
    async updateCounter(req, res) {
        try {
            const { icon, end, suffix, label, altText, overlay } = req.body;
            const updateData = { icon, end, suffix, label, altText, overlay };
            if (req.file) {
                updateData.bg = `/uploads/counters/${req.file.filename}`;
            }

            const data = await countersService.updateCounter(req.params.id, updateData);
            res.json({ success: true, data });
        } catch (error) {
            res.status(error.status || 500).json({ success: false, message: error.message });
        }
    }

    /**
     * Delete counter.
     */
    async deleteCounter(req, res) {
        try {
            await countersService.deleteCounter(req.params.id);
            res.json({ success: true, message: 'Counter deleted successfully' });
        } catch (error) {
            res.status(error.status || 500).json({ success: false, message: error.message });
        }
    }
}

module.exports = new CountersController();
