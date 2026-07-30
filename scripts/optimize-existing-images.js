// One-off migration: resizes + converts every already-uploaded image
// referenced in the DB to WebP, in place, and updates the stored path.
// Safe to re-run — already-.webp paths and missing files are skipped.
//
// Usage:  node scripts/optimize-existing-images.js
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const { convertToWebpFile } = require('../utils/imageConversion');

const Hero = require('../models/Hero');
const Blog = require('../models/Blog');
const HeroBackground = require('../models/HeroBackground');
const ServiceDetail = require('../models/ServiceDetail');
const Seo = require('../models/Seo');
const Client = require('../models/Client');
const Counter = require('../models/Counter');
const FAQ = require('../models/FAQ');
const Glimpse = require('../models/Glimpse');
const Parallax = require('../models/Parallax');

const UPLOADS_ROOT = path.join(__dirname, '../uploads');

const stats = {
    converted: 0,
    skippedWebp: 0,
    skippedExternal: 0,
    skippedMissing: 0,
    failed: 0,
    bytesBefore: 0,
    bytesAfter: 0,
};

function resolveAbsolute(relativePath) {
    const cleaned = relativePath.replace(/^\/?uploads\//, '');
    return path.join(UPLOADS_ROOT, cleaned);
}

async function convertPath(relativePath) {
    if (!relativePath || typeof relativePath !== 'string') return null;
    if (relativePath.startsWith('http')) {
        stats.skippedExternal++;
        return null;
    }
    if (relativePath.toLowerCase().endsWith('.webp')) {
        stats.skippedWebp++;
        return null;
    }

    const absolute = resolveAbsolute(relativePath);

    try {
        const result = await convertToWebpFile(absolute);
        if (!result) {
            stats.skippedMissing++;
            console.log(`  - missing on disk, skipped: ${relativePath}`);
            return null;
        }
        stats.converted++;
        stats.bytesBefore += result.bytesBefore;
        stats.bytesAfter += result.bytesAfter;
        const newRelative = relativePath.slice(0, relativePath.lastIndexOf('/') + 1) + path.basename(result.newPath);
        console.log(`  ✓ ${relativePath} -> ${newRelative} (${(result.bytesBefore / 1024).toFixed(0)}KB -> ${(result.bytesAfter / 1024).toFixed(0)}KB)`);
        return newRelative;
    } catch (err) {
        stats.failed++;
        console.error(`  ✗ failed: ${relativePath} - ${err.message}`);
        return null;
    }
}

async function migrateSimpleField(Model, field, label) {
    const docs = await Model.find({ [field]: { $exists: true, $ne: '' } });
    console.log(`\n${label}: ${docs.length} document(s)`);
    for (const doc of docs) {
        const newPath = await convertPath(doc[field]);
        if (newPath) {
            doc[field] = newPath;
            await doc.save();
        }
    }
}

async function migrateArrayField(Model, arrayField, subField, label) {
    const docs = await Model.find({ [arrayField]: { $exists: true, $not: { $size: 0 } } });
    console.log(`\n${label}: ${docs.length} document(s)`);
    for (const doc of docs) {
        let changed = false;
        for (const item of doc[arrayField]) {
            const newPath = await convertPath(item[subField]);
            if (newPath) {
                item[subField] = newPath;
                changed = true;
            }
        }
        if (changed) await doc.save();
    }
}

async function run() {
    await mongoose.connect(process.env.MONGO_URI_MAIN);
    console.log('Connected to MongoDB. Starting existing-image optimization...');

    await migrateSimpleField(Hero, 'image', 'Hero slides');
    await migrateSimpleField(Blog, 'image', 'Blog cover images');
    await migrateSimpleField(Blog, 'ogImage', 'Blog OG images');
    await migrateSimpleField(HeroBackground, 'backgroundImage', 'Hero background images');
    await migrateSimpleField(ServiceDetail, 'heroImage', 'Service detail hero images');
    await migrateSimpleField(Seo, 'ogImage', 'SEO OG images');
    await migrateSimpleField(Counter, 'bg', 'Counter background images');
    await migrateSimpleField(Parallax, 'imageUrl', 'Parallax image');
    await migrateSimpleField(FAQ, 'defaultImage', 'FAQ default image');
    await migrateArrayField(FAQ, 'items', 'image', 'FAQ item images');
    await migrateArrayField(Client, 'images', 'url', 'Client logos');
    await migrateArrayField(Glimpse, 'images', 'url', 'Glimpse images');

    console.log('\n=== Migration Summary ===');
    console.log(`Converted:              ${stats.converted}`);
    console.log(`Skipped (already WebP): ${stats.skippedWebp}`);
    console.log(`Skipped (external URL): ${stats.skippedExternal}`);
    console.log(`Skipped (file missing): ${stats.skippedMissing}`);
    console.log(`Failed:                 ${stats.failed}`);
    const beforeMB = stats.bytesBefore / (1024 * 1024);
    const afterMB = stats.bytesAfter / (1024 * 1024);
    console.log(`Total size: ${beforeMB.toFixed(1)}MB -> ${afterMB.toFixed(1)}MB (saved ${(beforeMB - afterMB).toFixed(1)}MB)`);

    await mongoose.disconnect();
    process.exit(0);
}

run().catch((err) => {
    console.error('Migration failed:', err);
    process.exit(1);
});
