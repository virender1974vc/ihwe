const partnersService = require('../services/partnersService');
const { logActivity } = require('../utils/logger');

/**
 * Controller to handle Partner Group and Partner requests.
 */
class PartnersController {
    /**
     * Get all partner groups.
     */
    async getAllGroups(req, res) {
        try {
            const data = await partnersService.getAllGroups();
            res.json({ success: true, data });
        } catch (error) {
            console.error('Fetch partners error:', error);
            res.status(500).json({ success: false, message: 'Server error' });
        }
    }

    /**
     * Add a new partner group.
     */
    async addGroup(req, res) {
        try {
            const data = await partnersService.addGroup(req.body);
            await logActivity(req, 'Created', 'Partners', `Added new partner group: ${req.body.name}`);
            res.json({ success: true, data, message: 'Partner group added successfully' });
        } catch (error) {
            console.error('Add group error:', error);
            res.status(500).json({ success: false, message: 'Server error' });
        }
    }

    /**
     * Update partner group settings.
     */
    async updateGroup(req, res) {
        try {
            const data = await partnersService.updateGroup(req.params.groupId, req.body);
            await logActivity(req, 'Updated', 'Partners', `Updated partner group: ${req.body.name || 'ID: ' + req.params.groupId}`);
            res.json({ success: true, data, message: 'Group updated successfully' });
        } catch (error) {
            console.error('Update group error:', error);
            res.status(error.status || 500).json({ success: false, message: error.message || 'Server error' });
        }
    }

    /**
     * Delete partner group.
     */
    async deleteGroup(req, res) {
        try {
            await partnersService.deleteGroup(req.params.groupId);
            await logActivity(req, 'Deleted', 'Partners', `Deleted partner group ID: ${req.params.groupId}`);
            res.json({ success: true, message: 'Partner group deleted successfully' });
        } catch (error) {
            console.error('Delete group error:', error);
            res.status(error.status || 500).json({ success: false, message: error.message || 'Server error' });
        }
    }

    /**
     * Add partner to a group.
     */
    async addPartner(req, res) {
        try {
            const data = await partnersService.addPartner(req.params.groupId, req.body);
            await logActivity(req, 'Created', 'Partners', `Added partner ${req.body.title} to group ${req.params.groupId}`);
            res.json({ success: true, data, message: 'Partner added successfully' });
        } catch (error) {
            console.error('Add partner error:', error);
            res.status(error.status || 500).json({ success: false, message: error.message || 'Server error' });
        }
    }

    /**
     * Update partner details in a group.
     */
    async updatePartner(req, res) {
        try {
            const data = await partnersService.updatePartner(req.params.groupId, req.params.partnerId, req.body);
            await logActivity(req, 'Updated', 'Partners', `Updated partner ${req.body.title || 'ID: ' + req.params.partnerId}`);
            res.json({ success: true, data, message: 'Partner updated successfully' });
        } catch (error) {
            console.error('Update partner error:', error);
            res.status(error.status || 500).json({ success: false, message: error.message || 'Server error' });
        }
    }

    /**
     * Delete partner from a group.
     */
    async deletePartner(req, res) {
        try {
            const data = await partnersService.deletePartner(req.params.groupId, req.params.partnerId);
            await logActivity(req, 'Deleted', 'Partners', `Deleted partner ID: ${req.params.partnerId} from group ${req.params.groupId}`);
            res.json({ success: true, data, message: 'Partner deleted successfully' });
        } catch (error) {
            console.error('Delete partner error:', error);
            res.status(error.status || 500).json({ success: false, message: error.message || 'Server error' });
        }
    }

    /**
     * Handle logo upload.
     */
    async uploadLogo(req, res) {
        try {
            if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });
            const imageUrl = `/uploads/partners/${req.file.filename}`;
            res.json({ success: true, imageUrl, message: 'Logo uploaded successfully' });
        } catch (error) {
            console.error('Logo upload error:', error);
            res.status(500).json({ success: false, message: 'Server error' });
        }
    }
}

module.exports = new PartnersController();
