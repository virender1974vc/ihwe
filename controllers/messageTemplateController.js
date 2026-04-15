const MessageTemplate = require('../models/MessageTemplate');
const { logActivity } = require('../utils/logger');
const path = require('path');
const fs = require('fs');

// ➤ Get all templates
const getAllTemplates = async (req, res) => {
    try {
        const templates = await MessageTemplate.find().populate('lastUpdatedBy', 'username');
        res.json({ success: true, data: templates });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// ➤ Get single template by form type
const getTemplateByType = async (req, res) => {
    try {
        const template = await MessageTemplate.findOne({ formType: req.params.type });
        if (!template) return res.status(404).json({ success: false, message: 'Template not found' });
        res.json({ success: true, data: template });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// ➤ Update or Create template (supports multipart/form-data for images)
const upsertTemplate = async (req, res) => {
    try {
        const { formType, emailSubject, emailBody, whatsappBody } = req.body;

        const updateData = {
            emailSubject,
            emailBody,
            whatsappBody,
            lastUpdatedBy: req.user?._id
        };

        // Handle header image upload
        if (req.files?.headerImage?.[0]) {
            updateData.headerImage = `/uploads/email-templates/${req.files.headerImage[0].filename}`;
        }
        // Handle footer image upload
        if (req.files?.footerImage?.[0]) {
            updateData.footerImage = `/uploads/email-templates/${req.files.footerImage[0].filename}`;
        }

        // If removeHeaderImage flag is set, clear it
        if (req.body.removeHeaderImage === 'true') updateData.headerImage = null;
        if (req.body.removeFooterImage === 'true') updateData.footerImage = null;

        const template = await MessageTemplate.findOneAndUpdate(
            { formType },
            updateData,
            { new: true, upsert: true }
        );

        await logActivity(req, 'Updated', 'Message Templates', `Updated response template for: ${formType}`);

        res.json({ success: true, data: template });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// ➤ Delete template
const deleteTemplate = async (req, res) => {
    try {
        const result = await MessageTemplate.findOneAndDelete({ formType: req.params.type });
        if (!result) return res.status(404).json({ success: false, message: 'Template not found' });

        await logActivity(req, 'Deleted', 'Message Templates', `Deleted response template for: ${req.params.type}`);
        res.json({ success: true, message: 'Template deleted successfully' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

module.exports = {
    getAllTemplates,
    getTemplateByType,
    upsertTemplate,
    deleteTemplate
};
