const FabricationPartner = require('../../models/exhibitor_seller/FabricationPartner');

class FabricationPartnerService {
    /**
     * Get fabrication partner data, creates default if none exists.
     * @returns {Promise<Object>}
     */
    async getFabricationPartner() {
        let data = await FabricationPartner.findOne();
        if (!data) {
            data = await new FabricationPartner({}).save();
        }
        return data;
    }

    /**
     * Update fabrication partner data.
     * @param {Object} updateData - Data to update.
     * @returns {Promise<Object>}
     */
    async updateFabricationPartner(updateData) {
        let data = await FabricationPartner.findOne();
        if (!data) {
            data = new FabricationPartner(updateData);
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
        let data = await FabricationPartner.findOne();
        if (!data) {
            data = new FabricationPartner();
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
        let data = await FabricationPartner.findOne();
        if (!data) {
            data = new FabricationPartner();
        }
        if (!data.footer) data.footer = {};
        data.footer.image = photoPath;
        data.markModified('footer');
        return await data.save();
    }
}

module.exports = new FabricationPartnerService();
