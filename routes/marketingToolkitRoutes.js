const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const marketingToolkitController = require('../controllers/marketingToolkitController');

// Multer Config
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/marketing/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 100 * 1024 * 1024
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/quicktime', 'video/x-msvideo'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            console.warn(`[Multer] Rejecting file with mimetype: ${file.mimetype}`);
            cb(null, true);
        }
    }
});

// Public/Exhibitor Routes
router.get('/templates', marketingToolkitController.getAllTemplates);
router.post('/usage/:id', marketingToolkitController.incrementUsage);

// Admin Routes
router.get('/admin/templates', marketingToolkitController.adminGetAllTemplates);
router.post('/admin/templates', upload.single('template'), marketingToolkitController.createTemplate);
router.put('/admin/templates/:id', upload.single('template'), marketingToolkitController.updateTemplate);
router.delete('/admin/templates/:id', marketingToolkitController.deleteTemplate);

module.exports = router;
