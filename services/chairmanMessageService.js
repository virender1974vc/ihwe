const ChairmanMessage = require('../models/ChairmanMessage');

/**
 * Service to handle Chairman's Message operations.
 */
class ChairmanMessageService {
    /**
     * Get chairman message data, creates default if none exists.
     * @returns {Promise<Object>}
     */
    async getChairmanMessage() {
        let data = await ChairmanMessage.findOne();
        if (!data) {
            data = await new ChairmanMessage({}).save();
        }
        return data;
    }

    /**
     * Update chairman message text data.
     * @param {Object} updateData - Data to update.
     * @returns {Promise<Object>}
     */
    async updateChairmanMessage(updateData) {
        let data = await ChairmanMessage.findOne();
        if (!data) {
            data = new ChairmanMessage(updateData);
        } else {
            const fields = ['title', 'heading', 'description', 'signatureName', 'chairmanName', 'chairmanDesignation', 'visionText'];
            fields.forEach(field => {
                if (updateData[field] !== undefined) {
                    data[field] = updateData[field];
                }
            });
        }
        return await data.save();
    }

    /**
     * Update chairman photo path.
     * @param {string} photoPath - Path to the photo image.
     * @returns {Promise<Object>}
     */
    async updateChairmanPhoto(photoPath) {
        let data = await ChairmanMessage.findOne();
        if (!data) {
            data = new ChairmanMessage({ photo: photoPath });
        } else {
            data.photo = photoPath;
        }
        return await data.save();
    }
}

module.exports = new ChairmanMessageService();
