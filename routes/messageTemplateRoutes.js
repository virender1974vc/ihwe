const express = require('express');
const router = express.Router();
const messageTemplateController = require('../controllers/messageTemplateController');
const { verifyToken } = require('../utils/verifyToken');

// ➤ Get all templates
router.get('/', verifyToken, messageTemplateController.getAllTemplates);

// ➤ Get template by form type
router.get('/:type', verifyToken, messageTemplateController.getTemplateByType);

// ➤ Update or Create template
router.post('/upsert', verifyToken, messageTemplateController.upsertTemplate);

// ➤ Delete template
router.delete('/:type', verifyToken, messageTemplateController.deleteTemplate);

module.exports = router;
