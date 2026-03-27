const GlobalPlatform = require('../models/GlobalPlatform');

/**
 * Service to handle Global Platform section operations.
 */
class GlobalPlatformService {
    /**
     * Get Global Platform data, creates default if none exists.
     */
    async getGlobalPlatformData() {
        let data = await GlobalPlatform.findOne();
        if (!data) {
            data = await new GlobalPlatform({
                descriptionHtml: '<p>The International Health & Wellness Expo (IH&WE) is one of India\'s largest and most impactful platforms dedicated to promoting holistic health, traditional systems of medicine, organic lifestyle, and wellness innovations.</p><p>It brings together industry leaders, professionals, government bodies, wellness brands, and the general public to explore and celebrate healthy living practices. IH&WE serves as a critical bridge between legacy wisdom and modern future-ready healthcare solutions.</p>'
            }).save();
        }
        return data;
    }

    /**
     * Update Global Platform text fields.
     */
    async updateGlobalPlatform(updateData) {
        const { subheading, title, highlightText, descriptionHtml, tagline, points, images } = updateData;

        let data = await GlobalPlatform.findOne();
        if (!data) {
            data = new GlobalPlatform({ subheading, title, highlightText, descriptionHtml, tagline, points, images });
        } else {
            if (subheading !== undefined) data.subheading = subheading;
            if (title !== undefined) data.title = title;
            if (highlightText !== undefined) data.highlightText = highlightText;
            if (descriptionHtml !== undefined) data.descriptionHtml = descriptionHtml;
            if (tagline !== undefined) data.tagline = tagline;
            if (points !== undefined) data.points = points;
            if (images !== undefined) data.images = images;
            data.updatedAt = Date.now();
        }

        return await data.save();
    }
}

module.exports = new GlobalPlatformService();
