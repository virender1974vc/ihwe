const { SitemapStream, streamToPromise } = require('sitemap');
const { Readable } = require('stream');
const Blog = require('../models/Blog');

const generateSitemap = async (hostname = 'https://ihwe.co.in') => {
    // Static routes from App.tsx
    const staticRoutes = [
        { url: '/', changefreq: 'daily', priority: 1.0 },
        { url: '/about', changefreq: 'monthly', priority: 0.8 },
        { url: '/advisory-board', changefreq: 'monthly', priority: 0.8 },
        { url: '/exhibitor-profile', changefreq: 'monthly', priority: 0.8 },
        { url: '/book-a-stand', changefreq: 'monthly', priority: 0.9 },
        { url: '/visitor-registration', changefreq: 'monthly', priority: 0.9 },
        { url: '/buyer-registration', changefreq: 'monthly', priority: 0.9 },
        { url: '/exhibition', changefreq: 'monthly', priority: 0.8 },
        { url: '/media-registration', changefreq: 'monthly', priority: 0.7 },
        { url: '/speaker-registration', changefreq: 'monthly', priority: 0.7 },
        { url: '/stall-designing-vendors', changefreq: 'monthly', priority: 0.7 },
        { url: '/why-exhibit', changefreq: 'monthly', priority: 0.8 },
        { url: '/partners', changefreq: 'monthly', priority: 0.7 },
        { url: '/conference', changefreq: 'monthly', priority: 0.8 },
        { url: '/exhibitors', changefreq: 'monthly', priority: 0.8 },
        { url: '/blog', changefreq: 'daily', priority: 0.8 },
        { url: '/contact', changefreq: 'monthly', priority: 0.7 },
        { url: '/gallery', changefreq: 'monthly', priority: 0.6 },
        { url: '/travel-accommodation', changefreq: 'monthly', priority: 0.6 },
        { url: '/e-promotion', changefreq: 'monthly', priority: 0.6 },
        { url: '/download-badge', changefreq: 'monthly', priority: 0.5 },
        { url: '/why-visit', changefreq: 'monthly', priority: 0.8 },
        { url: '/privacy-policy', changefreq: 'yearly', priority: 0.3 },
        { url: '/terms-of-service', changefreq: 'yearly', priority: 0.3 },
    ];

    try {
        // Dynamic routes: Blogs
        const blogs = await Blog.find({ status: 'published' }).select('slug updatedAt');
        const dynamicRoutes = blogs.map(blog => ({
            url: `/blog/${blog.slug}`,
            changefreq: 'weekly',
            priority: 0.7,
            lastmod: blog.updatedAt
        }));

        const allRoutes = [...staticRoutes, ...dynamicRoutes];

        const stream = new SitemapStream({ hostname });
        const xml = await streamToPromise(Readable.from(allRoutes).pipe(stream)).then(data => data.toString());

        return xml;
    } catch (error) {
        console.error('Error generating sitemap:', error);
        throw error;
    }
};

module.exports = { generateSitemap };
