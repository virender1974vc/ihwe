const express = require('express');
const router = express.Router();
const { generateSitemap } = require('../utils/sitemapGenerator');

router.get('/', async (req, res) => {
    try {
        // Automatically determine hostname if possible, or use default
        const protocol = req.protocol;
        const host = req.get('host');
        // If we are on localhost, we might want a production URL, but req.get('host') is good for testing
        const hostname = `${protocol}://${host}`;
        
        // For production, the user might want to hardcode the domain
        // const hostname = 'https://ihwe.co.in';

        const sitemap = await generateSitemap(hostname);
        
        res.header('Content-Type', 'application/xml');
        res.send(sitemap);
    } catch (error) {
        console.error('Sitemap route error:', error);
        res.status(500).send('Error generating sitemap');
    }
});

module.exports = router;
