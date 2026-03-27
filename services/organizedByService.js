const OrganizedBy = require('../models/OrganizedBy');

/**
 * Service to handle OrganizedBy section operations.
 */
class OrganizedByService {
    /**
     * Get content, creates default if none exists.
     */
    async getContent() {
        let content = await OrganizedBy.findOne();
        if (!content) {
            content = await OrganizedBy.create({
                subheading: 'The Visionaries',
                heading: 'Organized By',
                highlightText: 'By',
                badgeText: 'Non-Profit Organization',
                orgName: 'Namo Gange Trust',
                quote: 'The Expo is proudly organized by Namo Gange Trust, a non-profit organization working towards the integration of traditional and modern wellness systems for a healthier, more conscious society.',
                logoAlt: 'Namo Gange Trust'
            });
        }
        return content;
    }

    /**
     * Update content.
     */
    async updateContent(data) {
        return await OrganizedBy.findOneAndUpdate({}, { ...data, lastUpdated: Date.now() }, { upsert: true, new: true });
    }
}

module.exports = new OrganizedByService();
