const advisoryService = require('../services/advisoryService');
const { logActivity } = require('../utils/logger');

/**
 * Controller to handle Advisory Member requests.
 */
class AdvisoryController {
    /**
     * Get all advisory members.
     */
    async getAllMembers(req, res) {
        try {
            const data = await advisoryService.getAllMembers();
            res.json({ success: true, data });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    /**
     * Add new advisory member.
     */
    async createMember(req, res) {
        try {
            const data = await advisoryService.createMember(req.body);
            await logActivity(req, 'Created', 'Advisory Board', `Added new advisory member: ${req.body.name}`);
            res.json({ success: true, data });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    /**
     * Update advisory member.
     */
    async updateMember(req, res) {
        try {
            const data = await advisoryService.updateMember(req.params.id, req.body);
            await logActivity(req, 'Updated', 'Advisory Board', `Updated advisory member: ${req.body.name || 'ID: ' + req.params.id}`);
            res.json({ success: true, data });
        } catch (error) {
            res.status(error.status || 500).json({ success: false, message: error.message });
        }
    }

    /**
     * Delete advisory member.
     */
    async deleteMember(req, res) {
        try {
            await advisoryService.deleteMember(req.params.id);
            await logActivity(req, 'Deleted', 'Advisory Board', `Deleted advisory member ID: ${req.params.id}`);
            res.json({ success: true, message: "Member deleted successfully" });
        } catch (error) {
            res.status(error.status || 500).json({ success: false, message: error.message });
        }
    }

    /**
     * Handle image upload.
     */
    async uploadImage(req, res) {
        try {
            if (!req.file) {
                return res.status(400).json({ success: false, message: "No file uploaded" });
            }
            const relativePath = `/uploads/advisory/${req.file.filename}`;
            res.json({ success: true, url: relativePath });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
}

module.exports = new AdvisoryController();
