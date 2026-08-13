const stallService = require('../services/stallService');
const { logActivity } = require('../utils/logger');
class StallController {
    async getAllStalls(req, res) {
        try {
            const data = await stallService.getAllStalls();
            res.json({ success: true, data });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
    async getAvailableStalls(req, res) {
        try {
            const data = await stallService.getAvailableStalls(req.query);
            res.json({ success: true, data });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
    async addStall(req, res) {
        try {
            const data = await stallService.addStall(req.body);
            await logActivity(req, 'Created', 'Stalls', `Added new stall: ${req.body.stallNumber}`);
            res.status(201).json({ success: true, message: 'Stall added successfully', data });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
    async updateStall(req, res) {
        try {
            const data = await stallService.updateStall(req.params.id, req.body);
            await logActivity(req, 'Updated', 'Stalls', `Updated stall: ${req.body.stallNumber || 'ID: ' + req.params.id}`);
            res.json({ success: true, message: 'Stall updated successfully', data });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
    async makeAvailable(req, res) {
        try {
            const data = await stallService.makeAvailable(req.params.id);
            await logActivity(req, 'Updated', 'Stalls', `Made stall ${data.stallNumber} available`);
            res.json({ success: true, message: 'Stall is now available', data });
        } catch (error) {
            res.status(error.statusCode || 400).json({ success: false, message: error.message });
        }
    }
    async deleteStall(req, res) {
        try {
            await stallService.deleteStall(req.params.id);
            await logActivity(req, 'Deleted', 'Stalls', `Deleted stall ID: ${req.params.id}`);
            res.json({ success: true, message: 'Stall deleted successfully' });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
    async bulkDeleteStalls(req, res) {
        try {
            const { ids } = req.body;
            if (!ids || !Array.isArray(ids) || ids.length === 0) {
                return res.status(400).json({ success: false, message: 'No stall IDs provided' });
            }
            await stallService.bulkDeleteStalls(ids);
            await logActivity(req, 'Deleted', 'Stalls', `Bulk deleted ${ids.length} stalls`);
            res.json({ success: true, message: `${ids.length} stalls deleted successfully` });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
}
module.exports = new StallController();
