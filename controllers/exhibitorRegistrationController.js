const exhibitorRegistrationService = require('../services/exhibitorRegistrationService');
const { logActivity } = require('../utils/logger');

/**
 * Controller for handling Exhibitor Registration requests.
 */
class ExhibitorRegistrationController {
    /**
     * Get all registrations.
     */
    async getAllRegistrations(req, res) {
        try {
            const enriched = await exhibitorRegistrationService.getAllRegistrations();
            res.status(200).json({ success: true, data: enriched });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    async getRegistrationById(req, res) {
        try {
            const registration = await exhibitorRegistrationService.getRegistrationById(req.params.id);
            if (!registration) return res.status(404).json({ success: false, message: 'Registration not found' });
            res.status(200).json({ success: true, data: registration });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    /**
     * Add a new registration.
     */
    async addRegistration(req, res) {
        try {
            const savedRegistration = await exhibitorRegistrationService.addRegistration(req.body);
            
            await logActivity(req, 'Created', 'Exhibitor Bookings', `New booking: ${savedRegistration.companyName} (${savedRegistration.registrationId})`);

            res.status(201).json({ success: true, data: savedRegistration });
        } catch (error) {
            res.status(400).json({ success: false, message: error.message });
        }
    }

    /**
     * Update a registration.
     */
    async updateRegistration(req, res) {
        try {
            const updatedRegistration = await exhibitorRegistrationService.updateRegistration(req.params.id, req.body);
            
            if (updatedRegistration) {
                await logActivity(req, 'Updated', 'Exhibitor Bookings', `Updated booking: ${updatedRegistration.companyName} (${updatedRegistration.registrationId})`);
            }

            res.status(200).json({ success: true, data: updatedRegistration });
        } catch (error) {
            res.status(400).json({ success: false, message: error.message });
        }
    }

    /**
     * Delete a registration.
     */
    async deleteRegistration(req, res) {
        try {
            const registration = await exhibitorRegistrationService.getRegistrationById(req.params.id); // Need this method
            const result = await exhibitorRegistrationService.deleteRegistration(req.params.id);
            
            if (registration) {
                await logActivity(req, 'Deleted', 'Exhibitor Bookings', `Deleted booking: ${registration.companyName} (${registration.registrationId})`);
            }

            res.status(200).json({ success: true, message: 'Registration deleted successfully' });
        } catch (error) {
            res.status(400).json({ success: false, message: error.message });
        }
    }

    async syncProfileData(req, res) {
        try {
            const updated = await exhibitorRegistrationService.syncProfileData(req.params.id);
            res.status(200).json({ success: true, message: 'Profile data synced across all registrations', data: updated });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    async forceDocs(req, res) {
        try {
            const url = req.body.customPath || req.body.sampleUrl;
            if (!url) return res.status(400).json({ success: false, message: 'URL is required (customPath or sampleUrl)' });
            const result = await exhibitorRegistrationService.forceDocsScan(req.params.id, url);
            res.status(200).json({ success: true, message: 'Documents updated across all related registrations', data: result });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
}

module.exports = new ExhibitorRegistrationController();
