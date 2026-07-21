const express = require('express');
const { authMiddleware } = require('../middleware/authMiddleware');
const GeneratedPassBatch = require('../models/GeneratedPassBatch');
const PassTemplate = require('../models/PassTemplate');

const router = express.Router();
const ALLOWED_PASS_TYPES = new Set(['media', 'speaker', 'organizer', 'exhibitor', 'service', 'delegate', 'visitor', 'food']);

const normalizeNameRows = (names) => {
    if (!Array.isArray(names)) return [];
    const seen = new Set();
    return names
        .map((row) => ({
            name: String(row?.name || '').trim(),
            selected: row?.selected !== false,
        }))
        .filter((row) => {
            if (!row.name) return false;
            const key = row.name.toLowerCase();
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        });
};

router.get('/', authMiddleware, async (req, res) => {
    try {
        const filter = {};
        if (req.query.passType) {
            const passType = String(req.query.passType).toLowerCase();
            if (!ALLOWED_PASS_TYPES.has(passType)) {
                return res.status(400).json({ success: false, message: 'Invalid pass type' });
            }
            filter.passType = passType;
        }

        const batches = await GeneratedPassBatch.find(filter)
            .populate('templateId', 'name slug categories passTypes')
            .sort({ updatedAt: -1 })
            .limit(100);

        res.json({ success: true, data: batches });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

router.get('/:id', authMiddleware, async (req, res) => {
    try {
        const batch = await GeneratedPassBatch.findById(req.params.id)
            .populate('templateId');
        if (!batch) return res.status(404).json({ success: false, message: 'Pass batch not found' });
        res.json({ success: true, data: batch });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

router.post('/', authMiddleware, async (req, res) => {
    try {
        const passType = String(req.body?.passType || '').toLowerCase();
        if (!ALLOWED_PASS_TYPES.has(passType)) {
            return res.status(400).json({ success: false, message: 'Invalid pass type' });
        }

        const names = normalizeNameRows(req.body?.names);
        if (!names.length) {
            return res.status(400).json({ success: false, message: 'Add at least one name before saving' });
        }

        const template = await PassTemplate.findById(req.body?.templateId);
        if (!template) return res.status(404).json({ success: false, message: 'Pass template not found' });

        const batch = await GeneratedPassBatch.create({
            title: String(req.body?.title || '').trim(),
            passType,
            categoryLabel: String(req.body?.categoryLabel || passType).trim(),
            templateId: template._id,
            templateName: template.name,
            names,
            printSettings: {
                passesPerPage: Number(req.body?.printSettings?.passesPerPage || 8),
            },
            createdBy: req.user?._id,
        });

        res.status(201).json({ success: true, data: batch });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});

router.put('/:id', authMiddleware, async (req, res) => {
    try {
        const current = await GeneratedPassBatch.findById(req.params.id);
        if (!current) return res.status(404).json({ success: false, message: 'Pass batch not found' });

        const passType = String(req.body?.passType || current.passType).toLowerCase();
        if (!ALLOWED_PASS_TYPES.has(passType)) {
            return res.status(400).json({ success: false, message: 'Invalid pass type' });
        }

        const names = normalizeNameRows(req.body?.names);
        if (!names.length) {
            return res.status(400).json({ success: false, message: 'Add at least one name before saving' });
        }

        let templateName = current.templateName;
        if (req.body?.templateId && String(req.body.templateId) !== String(current.templateId)) {
            const template = await PassTemplate.findById(req.body.templateId);
            if (!template) return res.status(404).json({ success: false, message: 'Pass template not found' });
            templateName = template.name;
        }

        const batch = await GeneratedPassBatch.findByIdAndUpdate(
            req.params.id,
            {
                title: String(req.body?.title || '').trim(),
                passType,
                categoryLabel: String(req.body?.categoryLabel || passType).trim(),
                templateId: req.body?.templateId || current.templateId,
                templateName,
                names,
                printSettings: {
                    passesPerPage: Number(req.body?.printSettings?.passesPerPage || 8),
                },
                updatedBy: req.user?._id,
            },
            { new: true, runValidators: true }
        );

        res.json({ success: true, data: batch });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});

router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        const batch = await GeneratedPassBatch.findByIdAndDelete(req.params.id);
        if (!batch) return res.status(404).json({ success: false, message: 'Pass batch not found' });
        res.json({ success: true, message: 'Pass batch deleted' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
