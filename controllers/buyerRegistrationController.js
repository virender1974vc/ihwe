const buyerRegistrationService = require('../services/buyerRegistrationService');
const { logActivity } = require('../utils/logger');

/**
 * Controller to handle Buyer Registration requests.
 */
class BuyerRegistrationController {
    /**
     * Create a new registration.
     */
    async createRegistration(req, res) {
        try {
            const data = await buyerRegistrationService.createRegistration(req.body);
            res.status(201).json({ success: true, message: 'Registration submitted successfully', data });
        } catch (err) {
            console.error('Error submitting buyer registration:', err);
            res.status(err.status || 500).json({ success: false, message: err.message || 'Server Error' });
        }
    }

    /**
     * Get all registrations.
     */
    async getAllRegistrations(req, res) {
        try {
            const data = await buyerRegistrationService.getAllRegistrations();
            res.json({ success: true, data });
        } catch (err) {
            console.error('Error fetching buyer registrations:', err);
            res.status(err.status || 500).json({ success: false, message: err.message || 'Server Error' });
        }
    }

    /**
     * Get a single registration.
     */
    async getRegistrationById(req, res) {
        try {
            const data = await buyerRegistrationService.getRegistrationById(req.params.id);
            res.json({ success: true, data });
        } catch (err) {
            console.error('Error fetching buyer registration:', err);
            res.status(err.status || 500).json({ success: false, message: err.message || 'Server Error' });
        }
    }

    /**
     * Update a registration.
     */
    async updateRegistration(req, res) {
        try {
            const data = await buyerRegistrationService.updateRegistration(req.params.id, req.body);
            await logActivity(req, 'Updated', 'Buyer Registration', `Updated buyer registration ID: ${req.params.id}`);
            res.json({ success: true, message: 'Registration updated successfully', data });
        } catch (err) {
            console.error('Error updating buyer registration:', err);
            res.status(err.status || 500).json({ success: false, message: err.message || 'Server Error' });
        }
    }

    /**
     * Delete a registration.
     */
    async deleteRegistration(req, res) {
        try {
            await buyerRegistrationService.deleteRegistration(req.params.id);
            await logActivity(req, 'Deleted', 'Buyer Registration', `Deleted buyer registration ID: ${req.params.id}`);
            res.json({ success: true, message: 'Registration removed' });
        } catch (err) {
            console.error('Error deleting buyer registration:', err);
            res.status(err.status || 500).json({ success: false, message: err.message || 'Server Error' });
        }
    }
}

module.exports = new BuyerRegistrationController();
