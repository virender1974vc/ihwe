const Seo = require('../models/Seo');
const Blog = require('../models/Blog');
const CustomPage = require('../models/CustomPage');
const ServiceDetail = require('../models/ServiceDetail');

const SITE_URL = (process.env.SITE_URL || 'https://ihwe.in').replace(/\/$/, '');
const SITE_NAME = 'International Health & Wellness Expo (IHWE)';
const DEFAULT_TITLE = 'Global Health Connect | International Health & Wellness Expo 2026';
const DEFAULT_DESCRIPTION = 'Global Health Connect - Connecting Healthcare Globally. A global platform for healthcare innovation, wellness solutions and medical excellence.';
const DEFAULT_IMAGE = `${SITE_URL}/favicon-32x32.png`;

const absoluteUrl = (value) => {
    if (!value) return '';
    if (value.startsWith('http')) return value;
    return `${SITE_URL}${value.startsWith('/') ? '' : '/'}${value}`;
};

/**
 * Resolves the effective SEO/OG data for a given site path. Checks the
 * generic admin-managed Seo-by-path collection first, then falls back to
 * entity-specific models (Blog, ServiceDetail, CustomPage) so dynamic pages
 * get sane OG tags even if nobody has created an explicit Seo record for them.
 * Used by both the public /api/seo/page endpoint (browser) and the
 * /social-preview route (crawlers — see socialPreviewController).
 */
async function resolveOg(pagePath) {
    let source = null;
    let entityType = 'page';

    // 1. Explicit per-page SEO record (admin panel managed) — highest priority.
    source = await Seo.findOne({ page: pagePath, isActive: true }).lean();

    // 2. Blog post detail page.
    if (!source) {
        const blogMatch = pagePath.match(/^\/blog\/([^/]+)$/);
        if (blogMatch && blogMatch[1] !== 'all') {
            const blog = await Blog.findOne({ slug: blogMatch[1], status: 'published' }).lean();
            if (blog) {
                entityType = 'article';
                source = {
                    metaTitle: blog.metaTitle,
                    metaDescription: blog.metaDescription,
                    metaKeywords: blog.metaKeywords,
                    ogTitle: blog.ogTitle || blog.title,
                    ogDescription: blog.ogDescription || blog.excerpt,
                    ogImage: blog.ogImage || blog.image,
                    canonicalTag: blog.canonicalTag,
                    schemaMarkup: blog.schemaMarkup,
                    openGraphTags: blog.openGraphTags,
                };
            }
        }
    }

    // 3. Industry Zone / service detail page.
    if (!source) {
        const serviceMatch = pagePath.match(/^\/industry-zone\/([^/]+)$/);
        if (serviceMatch) {
            const slugOrId = serviceMatch[1];
            const service = await ServiceDetail.findOne({
                $or: [{ slug: slugOrId }, { serviceCardId: slugOrId }],
            }).lean();
            if (service) {
                source = {
                    metaTitle: service.h1Heading || service.serviceTitle,
                    ogTitle: service.serviceTitle,
                    ogImage: service.heroImage,
                };
            }
        }
    }

    // 4. Custom CMS-built page (single-segment slug).
    if (!source) {
        const slug = pagePath.replace(/^\//, '');
        if (slug && !slug.includes('/')) {
            const page = await CustomPage.findOne({ slug, status: 'active' }).lean();
            if (page) {
                source = {
                    metaTitle: page.seo?.title || page.title,
                    metaDescription: page.seo?.description,
                    metaKeywords: page.seo?.keywords,
                    ogTitle: page.seo?.title || page.title,
                    ogDescription: page.seo?.description,
                };
            }
        }
    }

    const resolvedTitle = source?.ogTitle || source?.metaTitle || DEFAULT_TITLE;
    const resolvedDescription = source?.ogDescription || source?.metaDescription || DEFAULT_DESCRIPTION;
    const resolvedImage = source?.ogImage ? absoluteUrl(source.ogImage) : DEFAULT_IMAGE;

    return {
        // Raw/legacy fields — kept so existing frontend rendering (canonical,
        // schema markup, power-user raw OG HTML overrides) keeps working.
        metaTitle: source?.metaTitle || DEFAULT_TITLE,
        metaDescription: source?.metaDescription || DEFAULT_DESCRIPTION,
        metaKeywords: source?.metaKeywords || '',
        openGraphTags: source?.openGraphTags || '',
        schemaMarkup: source?.schemaMarkup || '',
        canonicalTag: source?.canonicalTag || `${SITE_URL}${pagePath}`,
        // Resolved OG/Twitter fields — fallback chain already applied.
        ogTitle: resolvedTitle,
        ogDescription: resolvedDescription,
        ogImage: resolvedImage,
        ogType: entityType === 'article' ? 'article' : 'website',
        ogUrl: `${SITE_URL}${pagePath}`,
        siteName: SITE_NAME,
    };
}

module.exports = { resolveOg, SITE_URL, SITE_NAME };
