const marqueeService = require('../services/marqueeService');
const { logActivity } = require('../utils/logger');

/**
 * Controller to handle Marquee settings requests.
 */
class MarqueeController {
    /**
     * Get marquee settings.
     */
    async getMarquee(req, res) {
        try {
            const data = await marqueeService.getMarquee();
            res.json({ success: true, data });
        } catch (error) {
            console.error('Fetch marquee error:', error);
            res.status(500).json({ success: false, message: 'Server error' });
        }
    }

    /**
     * Update marquee settings.
     */
    async updateMarquee(req, res) {
        try {
            const data = await marqueeService.updateMarquee(req.body);
            await logActivity(req, 'Updated', 'Marquee Text', 'Updated marquee scrolling text');
            res.json({ success: true, data, message: 'Marquee updated successfully' });
        } catch (error) {
            console.error('Update marquee error:', error);
            res.status(500).json({ success: false, message: 'Server error' });
        }
    }
}

module.exports = new MarqueeController();
