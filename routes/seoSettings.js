const express = require('express');
const router = express.Router();
const multer = require('multer');
const fs = require('fs');
const seoSettingsController = require('../controllers/seoSettingsController');

// Configure multer for SEO Files (sitemap.xml, robots.txt, etc.)
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = 'uploads/seo-files/';
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname);
    }
});

const upload = multer({ storage: storage });

// Get Advanced SEO settings (scripts and files)
router.get('/advanced', (req, res) => seoSettingsController.getAdvancedSettings(req, res));

// Update global scripts
router.put('/scripts', (req, res) => seoSettingsController.updateScripts(req, res));

// Upload SEO File
router.post('/upload-file', upload.single('file'), (req, res) => seoSettingsController.uploadFile(req, res));

// Delete SEO File
router.delete('/file/:id', (req, res) => seoSettingsController.deleteFile(req, res));

module.exports = router;
