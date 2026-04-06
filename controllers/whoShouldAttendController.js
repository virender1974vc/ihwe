const whoShouldAttendService = require('../services/whoShouldAttendService');
const { logActivity } = require('../utils/logger');

/**
 * Controller to handle Who Should Attend section requests.
 */
class WhoShouldAttendController {
    /**
     * Get content.
     */
    async getContent(req, res) {
        try {
            const data = await whoShouldAttendService.getContent();
            res.json({ success: true, data });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    /**
     * Update headings and image.
     */
    async updateHeadings(req, res) {
        try {
            const { subheading, heading, highlightText, imageAlt } = req.body;
            const data = { subheading, heading, highlightText, imageAlt };
            if (req.file) {
                data.image = `/uploads/target/${req.file.filename}`;
            }
            const updatedContent = await whoShouldAttendService.updateHeadings(data);
            await logActivity(req, 'Updated', 'Target Audience', 'Updated target audience section headings/image');
            res.json({ success: true, data: updatedContent });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    /**
     * Add a group.
     */
    async addGroup(req, res) {
        try {
            const { group } = req.body;
            const updatedContent = await whoShouldAttendService.addGroup(group);
            await logActivity(req, 'Created', 'Target Audience', `Added new audience group: ${group}`);
            res.json({ success: true, data: updatedContent });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    /**
     * Update a group.
     */
    async updateGroup(req, res) {
        try {
            const { index } = req.params;
            const { group } = req.body;
            const updatedContent = await whoShouldAttendService.updateGroup(index, group);
            await logActivity(req, 'Updated', 'Target Audience', `Updated audience group: ${group}`);
            res.json({ success: true, data: updatedContent });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    /**
     * Delete a group.
     */
    async deleteGroup(req, res) {
        try {
            const { index } = req.params;
            const updatedContent = await whoShouldAttendService.deleteGroup(index);
            await logActivity(req, 'Deleted', 'Target Audience', `Deleted audience group index: ${index}`);
            res.json({ success: true, data: updatedContent });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
}

module.exports = new WhoShouldAttendController();
