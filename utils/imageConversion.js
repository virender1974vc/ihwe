const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const MAX_WIDTH = 1920;
const WEBP_QUALITY = 80;
const OPTIMIZABLE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'];

/**
 * Resizes (max width, preserves aspect ratio) and re-encodes an image file on
 * disk to WebP in place. Returns `{ newPath, bytesBefore, bytesAfter }`, or
 * `null` if the file doesn't exist or isn't an optimizable image type. The
 * original file is only deleted after the WebP write succeeds — if
 * conversion throws, the original is left untouched.
 *
 * Shared by middleware/optimizeImage.js (new uploads) and
 * scripts/optimize-existing-images.js (one-off migration of already-uploaded files).
 */
async function convertToWebpFile(absolutePath) {
    if (!fs.existsSync(absolutePath)) return null;
    const ext = path.extname(absolutePath).toLowerCase();
    if (!OPTIMIZABLE_EXTENSIONS.includes(ext)) return null;

    const bytesBefore = fs.statSync(absolutePath).size;
    const outputPath = absolutePath.slice(0, -ext.length) + '.webp';
    const sameFile = outputPath === absolutePath;
    const writeTarget = sameFile ? `${outputPath}.tmp` : outputPath;

    try {
        await sharp(absolutePath)
            .resize({ width: MAX_WIDTH, withoutEnlargement: true })
            .webp({ quality: WEBP_QUALITY })
            .toFile(writeTarget);

        if (sameFile) {
            fs.renameSync(writeTarget, outputPath);
        } else {
            fs.unlinkSync(absolutePath);
        }

        const bytesAfter = fs.statSync(outputPath).size;
        return { newPath: outputPath, bytesBefore, bytesAfter };
    } catch (err) {
        try {
            if (fs.existsSync(writeTarget)) fs.unlinkSync(writeTarget);
        } catch (_) {
            // best-effort cleanup of a partial temp file
        }
        throw err;
    }
}

module.exports = { convertToWebpFile, OPTIMIZABLE_EXTENSIONS };
