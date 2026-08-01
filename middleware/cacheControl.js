/**
 * Sets a public Cache-Control header for read-mostly public GET endpoints
 * (site settings, hero slides, counters, testimonials, etc.) so browsers and
 * any reverse proxy/CDN in front (Nginx) can serve repeat requests without a
 * DB round trip every time. `stale-while-revalidate` lets a slightly-stale
 * response be served instantly while a fresh one is fetched in the background,
 * so admin edits still show up quickly without every request hitting Mongo.
 */
const cacheControl = (seconds = 120) => (req, res, next) => {
    res.set('Cache-Control', `public, max-age=${seconds}, stale-while-revalidate=${seconds * 2}`);
    next();
};

module.exports = cacheControl;
