const termAndConditionService = require('../services/termAndConditionService');
const { logActivity } = require('../utils/logger');

class TermAndConditionController {
    async getAllTerms(req, res) {
        try {
            const data = await termAndConditionService.getAllTerms();
            res.json({ success: true, data });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
    async getTermByPage(req, res) {
        try {
            const { pageName } = req.params;
            const { eventId } = req.query;
            const data = await termAndConditionService.getTermByPage(pageName, eventId);
            res.json({ success: true, data });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
    async addTerm(req, res) {
        try {
            const data = await termAndConditionService.addTerm(req.body);
            await logActivity(req, 'Created', 'Terms & Conditions', `Added new T&C for page: ${req.body.pageName}`);
            res.status(201).json({ success: true, message: 'Term added successfully', data });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
    async updateTerm(req, res) {
        try {
            const data = await termAndConditionService.updateTerm(req.params.id, req.body);
            await logActivity(req, 'Updated', 'Terms & Conditions', `Updated T&C ID: ${req.params.id}`);
            res.json({ success: true, message: 'Term updated successfully', data });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
    async deleteTerm(req, res) {
        try {
            await termAndConditionService.deleteTerm(req.params.id);
            await logActivity(req, 'Deleted', 'Terms & Conditions', `Deleted T&C ID: ${req.params.id}`);
            res.json({ success: true, message: 'Term deleted successfully' });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
}

module.exports = new TermAndConditionController();
