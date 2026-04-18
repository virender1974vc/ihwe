const MarketingToolkit = require('../models/MarketingToolkit');
const fs = require('fs');
const path = require('path');

// Get all templates
exports.getAllTemplates = async (req, res) => {
    try {
        const { exhibitorId } = req.query;
        let query = { isActive: true };

        if (exhibitorId) {
            query.$or = [
                { assignedExhibitorId: null },
                { assignedExhibitorId: exhibitorId }
            ];
        } else {
            query.assignedExhibitorId = null;
        }

        const templates = await MarketingToolkit.find(query).sort({ createdAt: -1 });
        res.status(200).json({ success: true, data: templates });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Admin: Get all templates including inactive
exports.adminGetAllTemplates = async (req, res) => {
    try {
        const templates = await MarketingToolkit.find().sort({ createdAt: -1 });
        res.status(200).json({ success: true, data: templates });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.createTemplate = async (req, res) => {
    try {
        const templateData = req.body;
        if (req.file) {
            templateData.templateUrl = `/uploads/marketing/${req.file.filename}`;
        }
        if (typeof templateData.config === 'string') {
            templateData.config = JSON.parse(templateData.config);
        }

        if (templateData.assignedExhibitorId === '' || !templateData.assignedExhibitorId) {
            templateData.assignedExhibitorId = null;
        }

        const template = await MarketingToolkit.create(templateData);
        res.status(201).json({ success: true, data: template });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Update a template
exports.updateTemplate = async (req, res) => {
    try {
        const templateData = req.body;
        if (req.file) {
            templateData.templateUrl = `/uploads/marketing/${req.file.filename}`;
            templateData.thumbnailUrl = `/uploads/marketing/${req.file.filename}`;
        }

        if (typeof templateData.config === 'string') {
            templateData.config = JSON.parse(templateData.config);
        }

        if (templateData.assignedExhibitorId === '' || !templateData.assignedExhibitorId) {
            templateData.assignedExhibitorId = null;
        }

        const template = await MarketingToolkit.findByIdAndUpdate(req.params.id, templateData, { new: true });
        res.status(200).json({ success: true, data: template });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Delete a template
exports.deleteTemplate = async (req, res) => {
    try {
        const template = await MarketingToolkit.findById(req.params.id);
        if (!template) {
            return res.status(404).json({ success: false, message: 'Template not found' });
        }

        // Optional: Delete physical file
        if (template.templateUrl) {
            const filePath = path.join(__dirname, '..', template.templateUrl);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        }

        await MarketingToolkit.findByIdAndDelete(req.params.id);
        res.status(200).json({ success: true, message: 'Template deleted' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Increment usage count
exports.incrementUsage = async (req, res) => {
    try {
        await MarketingToolkit.findByIdAndUpdate(req.params.id, { $inc: { usageCount: 1 } });
        res.status(200).json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
