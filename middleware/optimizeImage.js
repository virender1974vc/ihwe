const path = require('path');
const { convertToWebpFile } = require('../utils/imageConversion');

async function processFile(file) {
    if (!file || !file.path) return;
    try {
        const result = await convertToWebpFile(file.path);
        if (!result) return; // not an optimizable image type — leave PDFs/etc untouched
        file.filename = path.basename(result.newPath);
        file.path = result.newPath;
        file.mimetype = 'image/webp';
    } catch (err) {
        console.error(`Image optimization failed for ${file.originalname}, keeping original upload:`, err.message);
    }
}

/**
 * Express middleware — insert AFTER a multer upload middleware (`upload.single(...)`,
 * `.array(...)`, or `.fields(...)`). Resizes any uploaded image down to a max width
 * and re-encodes it as WebP, then rewrites `file.filename`/`file.path`/`file.mimetype`
 * in place so downstream controllers that read `req.file.filename` to build the
 * stored URL keep working unchanged. Non-image uploads (PDFs, etc.) pass through
 * untouched. Never blocks the request — on any processing error it just keeps the
 * original upload and continues.
 */
async function optimizeImage(req, res, next) {
    try {
        const files = [];
        if (req.file) files.push(req.file);
        if (req.files) {
            if (Array.isArray(req.files)) {
                files.push(...req.files);
            } else {
                Object.values(req.files).forEach((group) => files.push(...group));
            }
        }
        await Promise.all(files.map(processFile));
        next();
    } catch (err) {
        console.error('optimizeImage middleware error:', err);
        next();
    }
}

module.exports = optimizeImage;
