const TravelPartner = require('../models/TravelPartner');

class TravelPartnerService {
    /**
     * Get travel partner data, creates default if none exists.
     * @returns {Promise<Object>}
     */
    async getTravelPartner() {
        let data = await TravelPartner.findOne();
        if (!data) {
            data = await new TravelPartner({}).save();
        }
        return data;
    }

    /**
     * Update travel partner data.
     * @param {Object} updateData - Data to update.
     * @returns {Promise<Object>}
     */
    async updateTravelPartner(updateData) {
        let data = await TravelPartner.findOne();
        if (!data) {
            data = new TravelPartner(updateData);
        } else {
            const fields = ['hero', 'stats', 'benefits', 'packages', 'footer'];
            fields.forEach(field => {
                if (updateData[field] !== undefined) {
                    data[field] = updateData[field];
                    data.markModified(field);
                }
            });
        }
        return await data.save();
    }

    /**
     * Update hero background image path.
     * @param {string} photoPath - Path to the image.
     * @returns {Promise<Object>}
     */
    async updateHeroImage(photoPath) {
        let data = await TravelPartner.findOne();
        if (!data) {
            data = new TravelPartner();
        }
        if (!data.hero) data.hero = {};
        data.hero.image = photoPath;
        data.markModified('hero');
        return await data.save();
    }

    /**
     * Update footer badge image path.
     * @param {string} photoPath - Path to the image.
     * @returns {Promise<Object>}
     */
    async updateFooterImage(photoPath) {
        let data = await TravelPartner.findOne();
        if (!data) {
            data = new TravelPartner();
        }
        if (!data.footer) data.footer = {};
        data.footer.image = photoPath;
        data.markModified('footer');
        return await data.save();
    }
}

module.exports = new TravelPartnerService();
