const { SitemapStream, streamToPromise } = require('sitemap');
const { Readable } = require('stream');
const Blog = require('../models/Blog');
const CustomPage = require('../models/CustomPage');
const ServiceDetail = require('../models/ServiceDetail');

const generateSitemap = async (hostname = 'https://ihwe.in') => {
    // Static routes matching active pages in pagesList.js
    const staticRoutes = [
        { url: '/', changefreq: 'daily', priority: 1.0 },
        { url: '/about', changefreq: 'weekly', priority: 0.8 },
        { url: '/partners', changefreq: 'weekly', priority: 0.8 },
        { url: '/advisory-board', changefreq: 'weekly', priority: 0.8 },
        { url: '/media-registration', changefreq: 'weekly', priority: 0.7 },
        { url: '/gallery', changefreq: 'weekly', priority: 0.7 },
        { url: '/why-exhibit', changefreq: 'weekly', priority: 0.8 },
        { url: '/exhibitors', changefreq: 'weekly', priority: 0.8 },
        { url: '/why-visit', changefreq: 'weekly', priority: 0.8 },
        { url: '/government-msme-pms-schemes', changefreq: 'weekly', priority: 0.8 },
        { url: '/buyer-seller-meet', changefreq: 'weekly', priority: 0.8 },
        { url: '/sponsership', changefreq: 'weekly', priority: 0.7 },
        { url: '/e-promotion-web', changefreq: 'weekly', priority: 0.7 },
        { url: '/partnership', changefreq: 'weekly', priority: 0.7 },
        { url: '/conference', changefreq: 'weekly', priority: 0.8 },
        { url: '/awards', changefreq: 'weekly', priority: 0.8 },
        { url: '/contact', changefreq: 'weekly', priority: 0.8 },
        
        // Registrations
        { url: '/book-a-stand', changefreq: 'monthly', priority: 0.7 },
        { url: '/visitor-registration', changefreq: 'monthly', priority: 0.7 },
        { url: '/buyer-registration', changefreq: 'monthly', priority: 0.7 },
        { url: '/international-buyer-registration', changefreq: 'monthly', priority: 0.7 },
        { url: '/international-visitor-registration', changefreq: 'monthly', priority: 0.7 },
        { url: '/group-registration', changefreq: 'monthly', priority: 0.7 },
        { url: '/seller-registration', changefreq: 'monthly', priority: 0.7 },
        { url: '/partner-registration', changefreq: 'monthly', priority: 0.7 },
        { url: '/delegate-registration', changefreq: 'monthly', priority: 0.7 },
        { url: '/download-badge', changefreq: 'monthly', priority: 0.6 },
        { url: '/awards/nomination', changefreq: 'monthly', priority: 0.7 },

        // Partners & Support
        { url: '/fabrication-partner', changefreq: 'monthly', priority: 0.6 },
        { url: '/travel-partner', changefreq: 'monthly', priority: 0.6 },
        { url: '/hotel-stay-partner', changefreq: 'monthly', priority: 0.6 },
        { url: '/printing-branding-partner', changefreq: 'monthly', priority: 0.6 },
        { url: '/logistic-partner', changefreq: 'monthly', priority: 0.6 },
        { url: '/hospitality-partner', changefreq: 'monthly', priority: 0.6 },
        { url: '/support/hotel-stay', changefreq: 'monthly', priority: 0.6 },
        { url: '/support/travel-assistance', changefreq: 'monthly', priority: 0.6 },
        { url: '/support/stall-design', changefreq: 'monthly', priority: 0.6 },
        { url: '/support/logistics-support', changefreq: 'monthly', priority: 0.6 },
        { url: '/support/printing-branding', changefreq: 'monthly', priority: 0.6 },
        { url: '/support/hospitality-desk', changefreq: 'monthly', priority: 0.6 },
        { url: '/stall-designing-vendors', changefreq: 'monthly', priority: 0.6 },

        // Policies
        { url: '/privacy-policy', changefreq: 'yearly', priority: 0.3 },
        { url: '/terms-of-service', changefreq: 'yearly', priority: 0.3 },
        { url: '/refund-policy', changefreq: 'yearly', priority: 0.3 },
        { url: '/payment-policy', changefreq: 'yearly', priority: 0.3 },
        { url: '/cancellation-policy', changefreq: 'yearly', priority: 0.3 }
    ];

    try {
        const dynamicRoutes = [];

        // 1. Dynamic Blogs
        const blogs = await Blog.find({ status: 'published' }).select('slug updatedAt');
        blogs.forEach(blog => {
            dynamicRoutes.push({
                url: `/blog/${blog.slug}`,
                changefreq: 'weekly',
                priority: 0.7,
                lastmod: blog.updatedAt
            });
        });

        // 2. Dynamic Custom Pages
        const customPages = await CustomPage.find({ status: 'active' }).select('slug updatedAt');
        customPages.forEach(page => {
            dynamicRoutes.push({
                url: `/${page.slug}`,
                changefreq: 'weekly',
                priority: 0.7,
                lastmod: page.updatedAt
            });
        });

        // 3. Dynamic Service details (Industry Zone)
        const serviceDetails = await ServiceDetail.find().select('slug serviceCardId updatedAt');
        serviceDetails.forEach(service => {
            const slugOrId = service.slug || service.serviceCardId;
            dynamicRoutes.push({
                url: `/industry-zone/${slugOrId}`,
                changefreq: 'weekly',
                priority: 0.8,
                lastmod: service.updatedAt
            });
        });

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
