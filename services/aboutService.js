const About = require('../models/About');

/**
 * Service to handle About section operations.
 */
class AboutService {
    /**
     * Get about data, creates default if none exists.
     * @returns {Promise<Object>}
     */
    async getAboutData() {
        let data = await About.findOne();
        if (!data) {
            data = await new About({}).save();
        }
        return data;
    }

    /**
     * Update about text data.
     * @param {Object} updateData - Data to update.
     * @returns {Promise<Object>}
     */
    async updateAboutText(updateData) {
        let data = await About.findOne();
        if (!data) {
            data = new About(updateData);
        } else {
            const fields = ['heading', 'subheading', 'highlightedWord', 'description', 'vision', 'mission', 'image1Alt', 'image2Alt', 'image3Alt'];
            fields.forEach(field => {
                if (updateData[field] !== undefined) {
                    data[field] = updateData[field];
                }
            });
        }
        return await data.save();
    }

    /**
     * Update about images paths.
     * @param {Object} imagePaths - Object containing image paths.
     * @returns {Promise<Object>}
     */
    async updateAboutImages(imagePaths) {
        let data = await About.findOne();
        if (!data) data = new About({});
        
        if (imagePaths.image1) data.image1 = imagePaths.image1;
        if (imagePaths.image2) data.image2 = imagePaths.image2;
        if (imagePaths.image3) data.image3 = imagePaths.image3;
        
        return await data.save();
    }
}

module.exports = new AboutService();
