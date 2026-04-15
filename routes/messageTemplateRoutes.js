const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const messageTemplateController = require('../controllers/messageTemplateController');
const { verifyToken } = require('../utils/verifyToken');

// Multer storage for email template header/footer images
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = path.join(__dirname, '../uploads/email-templates');
        if (!fs.existsSync(uploadPath)) fs.mkdirSync(uploadPath, { recursive: true });
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname.replace(/\s+/g, '-')}`);
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) cb(null, true);
        else cb(new Error('Only image files are allowed'));
    }
});

// ➤ Get all templates
router.get('/', verifyToken, messageTemplateController.getAllTemplates);

// ➤ Get template by form type
router.get('/:type', verifyToken, messageTemplateController.getTemplateByType);

// ➤ Update or Create template (with optional header/footer image upload)
router.post('/upsert', verifyToken, upload.fields([
    { name: 'headerImage', maxCount: 1 },
    { name: 'footerImage', maxCount: 1 }
]), messageTemplateController.upsertTemplate);

// ➤ Delete template
router.delete('/:type', verifyToken, messageTemplateController.deleteTemplate);

module.exports = router;
