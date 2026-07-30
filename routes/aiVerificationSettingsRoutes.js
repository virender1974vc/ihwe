const express = require('express');
const router = express.Router();
const multer = require('multer');
const { authMiddleware, adminMiddleware } = require('../middleware/authMiddleware');
const controller = require('../controllers/aiVerificationSettingsController');

// In-memory upload for the one-off "test this image" feature - never written to disk/Cloudinary.
// fileFilter rejects anything that isn't an image since this endpoint only ever feeds a vision model.
const memoryUpload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        if (!file.mimetype.startsWith('image/')) {
            return cb(new Error('Only image files are allowed for this test'));
        }
        cb(null, true);
    }
});

router.use(authMiddleware);

// @route   GET /api/ai-verification-settings
router.get('/', adminMiddleware, (req, res) => controller.getSettings(req, res));

// @route   PUT /api/ai-verification-settings
router.put('/', adminMiddleware, (req, res) => controller.updateSettings(req, res));

// @route   POST /api/ai-verification-settings/test
router.post('/test', adminMiddleware, (req, res) => controller.testConnection(req, res));

// @route   POST /api/ai-verification-settings/test-document
router.post('/test-document', (req, res, next) => {
    memoryUpload.single('file')(req, res, (err) => {
        if (err) return res.status(400).json({ success: false, message: err.message });
        next();
    });
}, (req, res) => controller.testDocumentVerification(req, res));

module.exports = router;
