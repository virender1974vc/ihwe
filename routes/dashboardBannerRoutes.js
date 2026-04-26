const express = require('express');
const router = express.Router();
const dashboardBannerController = require('../controllers/dashboardBannerController');
const { authMiddleware, adminMiddleware } = require('../middleware/authMiddleware');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure upload dir exists
const uploadDir = 'uploads/banners';
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => cb(null, `banner-${Date.now()}${path.extname(file.originalname)}`)
});
const upload = multer({ storage });

// Public/Dashboard routes
router.get('/page/:pageId', dashboardBannerController.getBannerByPage);

// Admin routes
router.get('/', authMiddleware, adminMiddleware, dashboardBannerController.getAllBanners);
router.post('/', authMiddleware, adminMiddleware, upload.single('image'), dashboardBannerController.upsertBanner);
router.delete('/:id', authMiddleware, adminMiddleware, dashboardBannerController.deleteBanner);

module.exports = router;
