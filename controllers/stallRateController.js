const stallRateService = require('../services/stallRateService');
const { logActivity } = require('../utils/logger');

class StallRateController {
    async getAllRates(req, res) {
        try {
            const data = await stallRateService.getAllRates();
            res.json({ success: true, data });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
    async getStoreRates(req, res) {
        try {
            const { eventId } = req.params;
            const data = await stallRateService.getRatesByEvent(eventId);
            res.json({ success: true, data });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
    async addRate(req, res) {
        try {
            const data = await stallRateService.addRate(req.body);
            await logActivity(req, 'Updated', 'Stall Rates', `Added/Updated rate for ${req.body.stallType} (${req.body.currency})`);
            res.status(201).json({ success: true, message: 'Rate added/updated successfully', data });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
    async getRate(req, res) {
        try {
            const { eventId, currency, stallType } = req.query;
            const data = await stallRateService.findRate(eventId, currency, stallType);
            res.json({ success: true, data });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
    async deleteRate(req, res) {
        try {
            await stallRateService.deleteRate(req.params.id);
            await logActivity(req, 'Deleted', 'Stall Rates', `Deleted stall rate ID: ${req.params.id}`);
            res.json({ success: true, message: 'Rate deleted successfully' });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
}

module.exports = new StallRateController();
