const visionMissionService = require('../services/visionMissionService');
const { logActivity } = require('../utils/logger');

/**
 * Controller to handle Vision and Mission section requests.
 */
class VisionMissionController {
    /**
     * Get Vision & Mission content.
     */
    async getContent(req, res) {
        try {
            const data = await visionMissionService.getContent();
            res.json({ success: true, data });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    /**
     * Update Vision & Mission content.
     */
    async updateContent(req, res) {
        try {
            const data = await visionMissionService.updateContent(req.body);
            await logActivity(req, 'Updated', 'Vision & Mission', 'Updated Vision & Mission content');
            res.json({ success: true, data });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
}

module.exports = new VisionMissionController();
