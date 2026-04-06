const speakerNominationService = require('../services/speakerNominationService');
const { logActivity } = require('../utils/logger');

/**
 * Controller to handle Speaker Nomination requests.
 */
class SpeakerNominationController {
    /**
     * Submit a speaker nomination.
     */
    async submitNomination(req, res) {
        try {
            const data = await speakerNominationService.submitNomination(req.body);
            res.status(201).json({ success: true, message: 'Nomination submitted successfully', data });
        } catch (error) {
            console.error('Error submitting nomination:', error);
            res.status(error.status || 500).json({ success: false, message: error.message || 'Server Error' });
        }
    }

    /**
     * Get all speaker nominations.
     */
    async getAllNominations(req, res) {
        try {
            const data = await speakerNominationService.getAllNominations();
            res.json({ success: true, data });
        } catch (error) {
            console.error('Error fetching nominations:', error);
            res.status(500).json({ success: false, message: 'Server Error' });
        }
    }

    /**
     * Delete a speaker nomination.
     */
    async deleteNomination(req, res) {
        try {
            await speakerNominationService.deleteNomination(req.params.id);
            await logActivity(req, 'Deleted', 'Speaker Nomination', `Deleted speaker nomination ID: ${req.params.id}`);
            res.json({ success: true, message: 'Nomination removed' });
        } catch (error) {
            console.error('Error deleting nomination:', error);
            res.status(error.status || 500).json({ success: false, message: error.message || 'Server Error' });
        }
    }
}

module.exports = new SpeakerNominationController();
