const awardsNominationService = require('../services/awardsNominationService');
const { logActivity } = require('../utils/logger');

class AwardsNominationController {

  // POST /api/awards-nomination
  async submitNomination(req, res) {
    try {
      const data = await awardsNominationService.submitNomination(req.body);
      res.status(201).json({ success: true, message: 'Nomination submitted successfully', data });
    } catch (error) {
      console.error('[Awards Nomination] Submit error:', error);
      res.status(error.status || 500).json({ success: false, message: error.message || 'Server Error' });
    }
  }

  // GET /api/awards-nomination
  async getAllNominations(req, res) {
    try {
      const filters = {
        status: req.query.status,
        awardCategory: req.query.awardCategory,
        search: req.query.search,
      };
      const result = await awardsNominationService.getAllNominations(filters);
      res.json({ success: true, ...result });
    } catch (error) {
      console.error('[Awards Nomination] Fetch error:', error);
      res.status(500).json({ success: false, message: 'Server Error' });
    }
  }

  // GET /api/awards-nomination/:id
  async getNominationById(req, res) {
    try {
      const data = await awardsNominationService.getNominationById(req.params.id);
      res.json({ success: true, data });
    } catch (error) {
      res.status(error.status || 500).json({ success: false, message: error.message || 'Server Error' });
    }
  }

  // PATCH /api/awards-nomination/:id/status
  async updateStatus(req, res) {
    try {
      const { status, adminRemarks } = req.body;
      const updatedBy = req.body.updatedBy || 'Admin';
      const data = await awardsNominationService.updateStatus(req.params.id, status, adminRemarks, updatedBy);
      await logActivity(req, 'Updated', 'Awards Nomination', `Status changed to ${status} for nomination ID: ${req.params.id}`);
      res.json({ success: true, message: 'Status updated successfully', data });
    } catch (error) {
      console.error('[Awards Nomination] Status update error:', error);
      res.status(error.status || 500).json({ success: false, message: error.message || 'Server Error' });
    }
  }

  // DELETE /api/awards-nomination/:id
  async deleteNomination(req, res) {
    try {
      await awardsNominationService.deleteNomination(req.params.id);
      await logActivity(req, 'Deleted', 'Awards Nomination', `Deleted nomination ID: ${req.params.id}`);
      res.json({ success: true, message: 'Nomination deleted successfully' });
    } catch (error) {
      console.error('[Awards Nomination] Delete error:', error);
      res.status(error.status || 500).json({ success: false, message: error.message || 'Server Error' });
    }
  }
}

module.exports = new AwardsNominationController();
