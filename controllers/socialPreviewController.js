const { resolveOg } = require('../services/ogResolverService');

const escapeHtml = (str = '') =>
    String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');

/**
 * Serves a minimal static HTML document with full OG/Twitter meta tags for a
 * given path. Link-preview crawlers (WhatsApp, Facebook, LinkedIn, X,
 * Telegram) don't execute JavaScript, so they never see the tags the React
 * SPA injects via react-helmet-async — Nginx routes just those crawlers'
 * requests here instead of serving the SPA's static index.html.
 */
exports.renderSocialPreview = async (req, res) => {
    try {
        const splat = Array.isArray(req.params.splat) ? req.params.splat.join('/') : (req.params.splat || '');
        const rawPath = '/' + splat.replace(/^\/+/, '');
        const og = await resolveOg(rawPath);

        const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<title>${escapeHtml(og.ogTitle)}</title>
<meta name="description" content="${escapeHtml(og.ogDescription)}" />
<link rel="canonical" href="${escapeHtml(og.canonicalTag)}" />

<meta property="og:type" content="${escapeHtml(og.ogType)}" />
<meta property="og:site_name" content="${escapeHtml(og.siteName)}" />
<meta property="og:title" content="${escapeHtml(og.ogTitle)}" />
<meta property="og:description" content="${escapeHtml(og.ogDescription)}" />
<meta property="og:image" content="${escapeHtml(og.ogImage)}" />
<meta property="og:url" content="${escapeHtml(og.ogUrl)}" />

<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${escapeHtml(og.ogTitle)}" />
<meta name="twitter:description" content="${escapeHtml(og.ogDescription)}" />
<meta name="twitter:image" content="${escapeHtml(og.ogImage)}" />
</head>
<body>
<h1>${escapeHtml(og.ogTitle)}</h1>
<p>${escapeHtml(og.ogDescription)}</p>
<p><a href="${escapeHtml(og.ogUrl)}">${escapeHtml(og.ogUrl)}</a></p>
</body>
</html>`;

        res.set('Content-Type', 'text/html; charset=utf-8');
        res.set('Cache-Control', 'public, max-age=300');
        res.send(html);
    } catch (error) {
        console.error('Social preview error:', error);
        res.status(500).send('<!doctype html><html><body>Unable to load preview</body></html>');
    }
};
