const seoService = require('../services/seoService');

/**
 * Controller to handle SEO requests.
 */
class SeoController {
    /**
     * Create or Update SEO.
     */
    async createOrUpdateSeo(req, res) {
        try {
            const { page, metaTitle, metaKeywords, metaDescription, openGraphTags, schemaMarkup, canonicalTag, isActive } = req.body;
            
            const updateData = {
                page,
                metaTitle,
                metaKeywords,
                metaDescription,
                openGraphTags,
                schemaMarkup,
                canonicalTag,
                isActive: isActive === 'true' || isActive === true
            };

            if (req.file) {
                updateData.ogImage = `/uploads/seo/${req.file.filename}`;
            }

            const data = await seoService.createOrUpdateSeo(page, updateData);
            res.json({ success: true, message: 'SEO data saved successfully', data });
        } catch (error) {
            console.error('SEO Create error:', error);
            res.status(500).json({ success: false, message: 'Server error' });
        }
    }

    /**
     * Get all SEO modules.
     */
    async getAllSeo(req, res) {
        try {
            const data = await seoService.getAllSeo();
            res.json({ success: true, data });
        } catch (error) {
            console.error('SEO List error:', error);
            res.status(500).json({ success: false, message: 'Server error' });
        }
    }

    /**
     * Update SEO by ID.
     */
    async updateSeo(req, res) {
        try {
            const { metaTitle, metaKeywords, metaDescription, openGraphTags, schemaMarkup, canonicalTag, isActive } = req.body;
            
            const updateData = {
                metaTitle,
                metaKeywords,
                metaDescription,
                openGraphTags,
                schemaMarkup,
                canonicalTag,
                isActive: isActive === 'true' || isActive === true
            };

            if (req.file) {
                updateData.ogImage = `/uploads/seo/${req.file.filename}`;
            }

            const data = await seoService.updateSeo(req.params.id, updateData);
            if (!data) {
                return res.status(404).json({ success: false, message: 'SEO data not found' });
            }

            res.json({ success: true, message: 'SEO data updated successfully', data });
        } catch (error) {
            console.error('SEO Update error:', error);
            res.status(500).json({ success: false, message: 'Server error' });
        }
    }

    /**
     * Delete SEO.
     */
    async deleteSeo(req, res) {
        try {
            await seoService.deleteSeo(req.params.id);
            res.json({ success: true, message: 'SEO data deleted successfully' });
        } catch (error) {
            console.error('SEO Delete error:', error);
            res.status(500).json({ success: false, message: 'Server error' });
        }
    }

    /**
     * Get SEO for a specific page.
     */
    async getSeoByPage(req, res) {
        try {
            const { path } = req.query;
            if (!path) {
                return res.status(400).json({ success: false, message: 'Path is required' });
            }

            const data = await seoService.getSeoByPage(path);
            res.json({ success: true, data });
        } catch (error) {
            console.error('SEO Fetch error:', error);
            res.status(500).json({ success: false, message: 'Server error' });
        }
    }
}

module.exports = new SeoController();
