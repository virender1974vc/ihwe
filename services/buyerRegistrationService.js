const BuyerRegistration = require('../models/BuyerRegistration');

/**
 * Service to handle Buyer Registration operations.
 */
class BuyerRegistrationService {
    /**
     * Create a new buyer registration.
     * @param {Object} data - Registration data.
     * @returns {Promise<Object>} - Created registration.
     */
    async createRegistration(data) {
        const requiredFields = ['companyName', 'country', 'contactPerson', 'designation', 'email', 'whatsapp', 'preferredMeetingType'];
        for (const field of requiredFields) {
            if (!data[field]) {
                throw { status: 400, message: `${field} is required` };
            }
        }
        const newRegistration = new BuyerRegistration(data);
        return await newRegistration.save();
    }

    /**
     * Get all buyer registrations.
     * @returns {Promise<Array>} - List of registrations.
     */
    async getAllRegistrations() {
        return await BuyerRegistration.find().sort({ createdAt: -1 });
    }

    /**
     * Get a single buyer registration by ID.
     * @param {string} id - Registration ID.
     * @returns {Promise<Object>} - Registration object.
     */
    async getRegistrationById(id) {
        const registration = await BuyerRegistration.findById(id);
        if (!registration) {
            throw { status: 404, message: 'Registration not found' };
        }
        return registration;
    }

    /**
     * Update a buyer registration.
     * @param {string} id - Registration ID.
     * @param {Object} data - Update data.
     * @returns {Promise<Object>} - Updated registration.
     */
    async updateRegistration(id, data) {
        const updatedRegistration = await BuyerRegistration.findByIdAndUpdate(
            id,
            data,
            { new: true, runValidators: true }
        );
        if (!updatedRegistration) {
            throw { status: 404, message: 'Registration not found' };
        }
        return updatedRegistration;
    }

    /**
     * Delete a buyer registration.
     * @param {string} id - Registration ID.
     * @returns {Promise<void>}
     */
    async deleteRegistration(id) {
        const registration = await BuyerRegistration.findById(id);
        if (!registration) {
            throw { status: 404, message: 'Registration not found' };
        }
        await registration.deleteOne();
    }
}

module.exports = new BuyerRegistrationService();
