const { generateSitemap } = require('../utils/sitemapGenerator');

/**
 * Service to handle Sitemap operations.
 */
class SitemapService {
    /**
     * Generate sitemap.
     */
    async generateSitemap(hostname) {
        return await generateSitemap(hostname);
    }
}

module.exports = new SitemapService();
