const Exhibitor = require('../models/Exhibitor');

/**
 * Service to handle Exhibitor operations.
 */
class ExhibitorService {
    /**
     * Get all exhibitors.
     */
    async getAllExhibitors() {
        return await Exhibitor.find().sort({ createdAt: -1 });
    }

    /**
     * Find exhibitor by ID.
     */
    async getExhibitorById(id) {
        return await Exhibitor.findById(id);
    }

    /**
     * Add new exhibitor.
     */
    async addExhibitor(data) {
        const newExhibitor = new Exhibitor(data);
        return await newExhibitor.save();
    }

    /**
     * Update exhibitor.
     */
    async updateExhibitor(id, data) {
        return await Exhibitor.findByIdAndUpdate(id, data, { new: true });
    }

    /**
     * Delete exhibitor.
     */
    async deleteExhibitor(id) {
        return await Exhibitor.findByIdAndDelete(id);
    }
}

module.exports = new ExhibitorService();
