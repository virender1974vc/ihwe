const MessageTemplate = require('../models/MessageTemplate');
const { logActivity } = require('../utils/logger');

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

// ➤ Update or Create template
const upsertTemplate = async (req, res) => {
    try {
        const { formType, emailSubject, emailBody, whatsappBody } = req.body;
        
        const template = await MessageTemplate.findOneAndUpdate(
            { formType },
            { 
                emailSubject, 
                emailBody, 
                whatsappBody, 
                lastUpdatedBy: req.user?._id // Assuming auth middleware provides req.user
            },
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
