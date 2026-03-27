const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const seoController = require('../controllers/seoController');

// Configure multer for OG Image upload
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = 'uploads/seo/';
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        cb(null, 'og-' + Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

// Create or Update SEO
router.post('/create', upload.single('ogImage'), (req, res) => seoController.createOrUpdateSeo(req, res));

// Get all SEO modules (for admin list)
router.get('/all', (req, res) => seoController.getAllSeo(req, res));

// Update by ID
router.put('/update/:id', upload.single('ogImage'), (req, res) => seoController.updateSeo(req, res));

// Delete SEO
router.delete('/delete/:id', (req, res) => seoController.deleteSeo(req, res));

// Get SEO for a specific page (for website)
router.get('/page', (req, res) => seoController.getSeoByPage(req, res));

module.exports = router;
