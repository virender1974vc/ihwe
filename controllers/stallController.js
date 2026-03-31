const stallService = require('../services/stallService');
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
            const data = await stallService.getAvailableStalls();
            res.json({ success: true, data });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
    async addStall(req, res) {
        try {
            const data = await stallService.addStall(req.body);
            res.status(201).json({ success: true, message: 'Stall added successfully', data });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
    async updateStall(req, res) {
        try {
            const data = await stallService.updateStall(req.params.id, req.body);
            res.json({ success: true, message: 'Stall updated successfully', data });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
    async deleteStall(req, res) {
        try {
            await stallService.deleteStall(req.params.id);
            res.json({ success: true, message: 'Stall deleted successfully' });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
}
module.exports = new StallController();