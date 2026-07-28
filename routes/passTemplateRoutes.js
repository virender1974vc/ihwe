const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { authMiddleware } = require('../middleware/authMiddleware');
const PassTemplate = require('../models/PassTemplate');

const router = express.Router();
const uploadDir = path.join(__dirname, '../uploads/pass-template-assets');

if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadDir),
    filename: (_req, file, cb) => {
        const safeBase = path.basename(file.originalname, path.extname(file.originalname)).replace(/[^a-z0-9_-]+/gi, '-').slice(0, 48);
        cb(null, `${Date.now()}-${safeBase}${path.extname(file.originalname).toLowerCase()}`);
    }
});

const allowedMimeTypes = new Set(['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/svg+xml']);
const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
        if (!allowedMimeTypes.has(file.mimetype)) {
            return cb(new Error('Unsupported image type. Upload PNG, JPG, JPEG, WebP, or SVG.'));
        }
        cb(null, true);
    }
});

const textLayer = (id, name, x, y, width, height, text, style = {}) => ({
    id, name, type: 'text', visible: true, locked: false, x, y, width, height, rotation: 0, opacity: 1, zIndex: style.zIndex || 10,
    text, binding: style.binding || '', conditions: [], passTypeVisibility: [], categoryVisibility: [],
    style: {
        fontFamily: style.fontFamily || 'Inter, Arial, sans-serif',
        fontSize: style.fontSize || 22,
        fontWeight: style.fontWeight || 700,
        color: style.color || '#172033',
        textAlign: style.textAlign || 'center',
        lineHeight: style.lineHeight || 1.15,
        textTransform: style.textTransform || 'none',
        letterSpacing: style.letterSpacing || 0,
        textShadow: style.textShadow || '',
        autoScale: style.autoScale !== false,
        maxLines: style.maxLines || 2,
    }
});

const placeholderLayer = (id, name, x, y, width, height, options = {}) => ({
    id, name, type: options.type || 'image', visible: true, locked: false, x, y, width, height, maxWidth: options.maxWidth || width,
    maxHeight: options.maxHeight || height, rotation: 0, opacity: 1, zIndex: options.zIndex || 20,
    assetUrl: '', assetName: '', placeholder: options.placeholder || name, required: false,
    aspectRatioLocked: true, freeResize: false, scalePercent: 100, objectFit: options.objectFit || 'contain', objectPosition: 'center',
    backgroundColor: options.backgroundColor || 'transparent', border: options.border || '1px dashed #cbd5e1',
    borderRadius: options.borderRadius || 8, padding: options.padding || 8, margin: 0,
    horizontalAlignment: options.horizontalAlignment || 'center', verticalAlignment: options.verticalAlignment || 'middle',
    conditions: [], passTypeVisibility: [], eventVisibility: [], categoryVisibility: [], showWhenDataExists: false,
    quality: { width: 0, height: 0, dpi: 0, fileType: '', fileSize: 0, warnings: [] },
});

const assetLayer = (id, name, x, y, width, height, assetUrl, options = {}) => ({
    ...placeholderLayer(id, name, x, y, width, height, {
        ...options,
        border: options.border || 'none',
        borderRadius: options.borderRadius || 0,
        padding: options.padding || 0,
    }),
    assetUrl,
    assetName: options.assetName || path.basename(decodeURIComponent(assetUrl)),
    opacity: options.opacity || 1,
    filter: options.filter || '',
    mixBlendMode: options.mixBlendMode || 'normal',
    required: true,
});

const shapeLayer = (id, name, x, y, width, height, style = {}) => ({
    id, name, type: 'shape', visible: true, locked: false, x, y, width, height, rotation: 0, opacity: style.opacity || 1, zIndex: style.zIndex || 1,
    shape: style.shape || 'rectangle',
    style: {
        backgroundColor: style.backgroundColor || '#ffffff',
        backgroundImage: '',
        gradient: style.gradient || '',
        border: style.border || 'none',
        borderRadius: style.borderRadius || 0,
    },
    conditions: [], passTypeVisibility: [], categoryVisibility: [],
});

const groupLayer = (id, name, x, y, width, height, groupId, zIndex = 30) => ({
    id, name, type: 'logoGroup', visible: true, locked: false, x, y, width, height, rotation: 0, opacity: 1, zIndex,
    groupId, conditions: [], passTypeVisibility: [], categoryVisibility: [],
});

const emptyLogo = (id, name, width = 80, height = 56) => ({
    id, name, type: 'logo', category: 'custom', assetUrl: '', assetName: '', visible: true,
    x: 0, y: 0, width, height, maxWidth: width * 1.5, maxHeight: height * 1.5,
    aspectRatioLocked: true, freeResize: false, scalePercent: 100, rotation: 0, opacity: 1,
    border: 'none', borderRadius: 4, backgroundColor: 'transparent', padding: 4, margin: 0,
    horizontalAlignment: 'center', verticalAlignment: 'middle', objectFit: 'contain', objectPosition: 'center',
    zIndex: 1, showForPassTypes: [], showForEvents: [], showForCategories: [], showWhenDataExists: false,
    conditions: [], quality: { width: 0, height: 0, dpi: 0, fileType: '', fileSize: 0, warnings: [] },
});

const logoGroup = (id, title, x, y, width, height, logos) => ({
    id, title, titleFontSize: 12, titleFontWeight: 700, titleColor: '#334155', alignment: 'center',
    x, y, width, height, logosPerRow: Math.max(logos.length, 1), rows: 1, logoGap: 12, rowGap: 8,
    padding: 8, backgroundColor: 'transparent', border: 'none', divider: false, visible: true,
    layoutDirection: 'row', automaticWrapping: true, manualPlacement: false, logos,
});

const referenceTemplate = () => ({
    name: 'Reference Editable Expo Pass',
    slug: 'reference-editable-expo-pass',
    templateVersion: 12,
    description: 'Editable 1122x1533 expo pass template using the backend reference image assets as default layers.',
    orientation: 'portrait',
    canvas: { width: 1122, height: 1533, unit: 'px', dpi: 300, backgroundColor: '#ffffff', safeArea: { top: 28, right: 28, bottom: 28, left: 28 } },
    passTypes: ['media', 'speaker', 'organizer', 'exhibitor', 'service', 'vehicle', 'visitor', 'delegate', 'service_provider'],
    categories: ['Media', 'Speaker', 'Organizer', 'Exhibitor', 'Service', 'Vehicle', 'Visitor', 'Delegate', 'Service Provider'],
    logoPriority: ['individualPassOverride', 'passTypeLogo', 'eventLogo', 'templateDefaultLogo'],
    layers: [
        shapeLayer('background', 'White Background', 0, 0, 1122, 1533, { backgroundColor: '#ffffff', zIndex: 0 }),
        assetLayer('pass-background-image', 'Full Background Image', 0, 0, 1122, 1533, '/pass-template-images/BG.png', { objectFit: 'cover', zIndex: 1, assetName: 'BG.png' }),
        assetLayer('top-namo-gange-logo', 'Top Namo Gange Logo', 204, 40, 714, 318, '/pass-template-images/NGT.png', { objectFit: 'contain', zIndex: 9, assetName: 'NGT.png', opacity: 0.97, filter: 'drop-shadow(0 0 18px rgba(255,255,255,0.95)) drop-shadow(0 2px 7px rgba(0,0,0,0.18)) saturate(1.04)' }),
        textLayer('presents-label', 'Presents Label', 458, 326, 206, 48, 'Presents', { fontFamily: 'Georgia, serif', fontSize: 34, fontWeight: 700, color: '#251f24', zIndex: 14, maxLines: 1, textShadow: '0 1px 2px rgba(255,255,255,0.9)' }),
        assetLayer('event-title-artwork', '9th IHWE Event Artwork', 0, 342, 1122, 370, '/pass-template-images/9ihwe.png', { objectFit: 'fill', zIndex: 9, assetName: '9ihwe.png', opacity: 0.95, filter: 'drop-shadow(0 0 22px rgba(255,255,255,0.98)) drop-shadow(0 3px 8px rgba(255,255,255,0.65)) saturate(1.05)' }),
        textLayer('event-date', 'Event Date', 250, 714, 622, 68, '21st to 23nd August at', { fontFamily: 'Aladin, Arial, sans-serif', fontSize: 62, fontWeight: 400, color: '#1e2027', zIndex: 10, maxLines: 1, textShadow: '0 0 8px rgba(255,255,255,0.95)' }),
        textLayer('venue', 'Hall and Venue', 38, 768, 1046, 84, 'Hall No. 08,09 & 10 Pragati Maidan', { fontFamily: 'Aladin, Arial, sans-serif', fontSize: 72, fontWeight: 400, color: '#b70f2d', zIndex: 10, maxLines: 1, textShadow: '0 0 7px rgba(255,255,255,0.95)' }),
        textLayer('concurrent-label', 'Concurrent Events Label', 0, 861, 1122, 40, 'along with concurrent events', { fontFamily: 'Aladin, Arial, sans-serif', fontSize: 37, fontWeight: 400, color: '#273070', zIndex: 10, maxLines: 1, textShadow: '0 0 5px rgba(255,255,255,0.85)' }),
        assetLayer('concurrent-events-strip', 'Concurrent Events Logos Strip', 78, 916, 966, 128, '/pass-template-images/3%20logo%20png.png', { objectFit: 'fill', zIndex: 11, assetName: '3 logo png.png' }),
        shapeLayer('name-blue-band', 'Name Blue Band', 0, 1075, 1122, 126, { backgroundColor: '#079fd3', zIndex: 8 }),
        textLayer('person-name', 'Person Name', 0, 1091, 1122, 92, '{{person.name}}', { fontFamily: 'Arial, Helvetica, sans-serif', fontSize: 72, fontWeight: 700, color: '#ffffff', zIndex: 12, binding: 'person.name', maxLines: 1 }),
        shapeLayer('footer-logos-band', 'Sponsored Supported Band', 0, 1201, 1122, 203, { backgroundColor: '#fff8d6', zIndex: 7 }),
        assetLayer('sponsor-support-strip', 'Sponsored and Supported Logos Strip', 0, 1204, 1122, 196, '/pass-template-images/Logs.png', { objectFit: 'fill', zIndex: 12, assetName: 'Logs.png' }),
        shapeLayer('category-maroon-band', 'Pass Category Band', 0, 1404, 1122, 129, { backgroundColor: '#c71359', zIndex: 8 }),
        textLayer('category-title', 'Category Title', 0, 1426, 1122, 92, '{{pass.category}}', { fontFamily: 'Arial, Helvetica, sans-serif', fontSize: 82, fontWeight: 700, color: '#ffffff', zIndex: 12, binding: 'pass.category', textTransform: 'uppercase', maxLines: 1 }),
    ],
    logoGroups: [
        { ...logoGroup('concurrent-events', 'Concurrent Events', 112, 872, 898, 172, [
            emptyLogo('concurrent-logo-1', 'Concurrent Event Logo 1', 190, 62),
            emptyLogo('concurrent-logo-2', 'Concurrent Event Logo 2', 190, 62),
            emptyLogo('concurrent-logo-3', 'Concurrent Event Logo 3', 190, 62),
        ]), visible: false },
        { ...logoGroup('sponsors', 'Sponsored By', 95, 1175, 360, 105, [
            emptyLogo('sponsor-logo-1', 'Sponsor Logo 1', 145, 62),
            emptyLogo('sponsor-logo-2', 'Sponsor Logo 2', 105, 62),
        ]), visible: false },
        { ...logoGroup('supporters', 'Supported By', 565, 1175, 455, 105, [
            emptyLogo('supporter-logo-1', 'Supporter Logo 1', 105, 62),
            emptyLogo('supporter-logo-2', 'Supporter Logo 2', 105, 62),
            emptyLogo('supporter-logo-3', 'Government / Institution Logo', 125, 62),
        ]), visible: false },
    ],
    overrides: {},
    isDefault: true,
    isActive: true,
});

const ensureReferenceTemplate = async () => {
    let template = await PassTemplate.findOne({ slug: 'reference-editable-expo-pass' });
    const nextTemplate = referenceTemplate();
    if (!template) {
        template = await PassTemplate.create(nextTemplate);
    } else if (template.templateVersion !== nextTemplate.templateVersion || template.canvas?.width !== 1122 || template.canvas?.height !== 1533) {
        template = await PassTemplate.findByIdAndUpdate(
            template._id,
            {
                templateVersion: nextTemplate.templateVersion,
                description: nextTemplate.description,
                orientation: nextTemplate.orientation,
                canvas: nextTemplate.canvas,
                layers: nextTemplate.layers,
                logoGroups: nextTemplate.logoGroups,
                passTypes: nextTemplate.passTypes,
                categories: nextTemplate.categories,
                logoPriority: nextTemplate.logoPriority,
            },
            { returnDocument: 'after' }
        );
    }
    return template;
};

router.get('/', authMiddleware, async (req, res) => {
    try {
        await ensureReferenceTemplate();
        // A template is usable for an event if it's global (no eventId) OR scoped to
        // that specific event — so the shared reference template always shows up
        // alongside any event-specific ones.
        const query = req.query.eventId ? { $or: [{ eventId: null }, { eventId: req.query.eventId }] } : {};
        const templates = await PassTemplate.find(query).sort({ isDefault: -1, updatedAt: -1 });
        res.json({ success: true, data: templates });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

router.get('/default', authMiddleware, async (_req, res) => {
    try {
        const template = await ensureReferenceTemplate();
        res.json({ success: true, data: template });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

router.post('/', authMiddleware, async (req, res) => {
    try {
        const { _id, id, createdAt, updatedAt, __v, ...payload } = req.body || {};
        if (payload.slug) {
            const existing = await PassTemplate.findOne({ slug: payload.slug });
            if (existing) {
                const updated = await PassTemplate.findByIdAndUpdate(
                    existing._id,
                    { ...payload, updatedBy: req.user?._id },
                    { returnDocument: 'after', runValidators: true }
                );
                return res.json({ success: true, data: updated });
            }
        }
        const template = await PassTemplate.create({ ...payload, createdBy: req.user?._id });
        res.status(201).json({ success: true, data: template });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});

router.put('/:id', authMiddleware, async (req, res) => {
    try {
        const template = await PassTemplate.findByIdAndUpdate(
            req.params.id,
            { ...req.body, updatedBy: req.user?._id },
            { returnDocument: 'after', runValidators: true }
        );
        if (!template) return res.status(404).json({ success: false, message: 'Pass template not found' });
        res.json({ success: true, data: template });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});

router.post('/upload-asset', authMiddleware, upload.single('asset'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ success: false, message: 'No image uploaded' });
        const fileSizeMb = req.file.size / (1024 * 1024);
        const warnings = [];
        if (fileSizeMb > 5) warnings.push('Large file: verify print workflow performance before batch printing.');
        res.json({
            success: true,
            data: {
                url: `/uploads/pass-template-assets/${req.file.filename}`,
                originalName: req.file.originalname,
                fileType: req.file.mimetype,
                fileSize: req.file.size,
                warnings,
            }
        });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});

module.exports = router;
