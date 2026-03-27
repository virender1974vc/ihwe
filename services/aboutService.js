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
            const fields = ['heading', 'subheading', 'highlightedWord', 'description', 'vision', 'mission'];
            fields.forEach(field => {
                if (updateData[field] !== undefined) {
                    data[field] = updateData[field];
                }
            });
        }
        return await data.save();
    }

    /**
     * Update about video path.
     * @param {string} videoPath - New video path.
     * @returns {Promise<Object>}
     */
    async updateAboutVideo(videoPath) {
        if (!videoPath) throw { status: 400, message: 'Video path is required' };
        
        let data = await About.findOne();
        if (!data) data = new About({});
        data.video = videoPath;
        return await data.save();
    }
}

module.exports = new AboutService();
