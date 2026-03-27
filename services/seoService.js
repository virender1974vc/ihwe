const Seo = require('../models/Seo');

/**
 * Service to handle SEO operations.
 */
class SeoService {
    /**
     * Create or Update SEO.
     */
    async createOrUpdateSeo(page, updateData) {
        return await Seo.findOneAndUpdate(
            { page },
            updateData,
            { new: true, upsert: true }
        );
    }

    /**
     * Get all SEO modules.
     */
    async getAllSeo() {
        return await Seo.find().sort({ updatedAt: -1 });
    }

    /**
     * Update SEO by ID.
     */
    async updateSeo(id, updateData) {
        return await Seo.findByIdAndUpdate(id, updateData, { new: true });
    }

    /**
     * Delete SEO.
     */
    async deleteSeo(id) {
        return await Seo.findByIdAndDelete(id);
    }

    /**
     * Get SEO for a specific page.
     */
    async getSeoByPage(pagePath) {
        return await Seo.findOne({ page: pagePath, isActive: true });
    }
}

module.exports = new SeoService();
