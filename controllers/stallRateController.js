const stallRateService = require('../services/stallRateService');

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
            res.json({ success: true, message: 'Rate deleted successfully' });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
}

module.exports = new StallRateController();
