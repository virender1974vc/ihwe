const sitemapService = require('../services/sitemapService');

/**
 * Controller to handle Sitemap requests.
 */
class SitemapController {
    /**
     * Get sitemap.
     */
    async getSitemap(req, res) {
        try {
            // Use SITE_URL from .env if available, otherwise determine from request
            const hostname = process.env.SITE_URL || `${req.protocol}://${req.get('host')}`;
            
            const sitemap = await sitemapService.generateSitemap(hostname);
            
            res.header('Content-Type', 'application/xml');
            res.send(sitemap);
        } catch (error) {
            console.error('Sitemap route error:', error);
            res.status(500).send('Error generating sitemap');
        }
    }
}

module.exports = new SitemapController();
