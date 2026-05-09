const express = require('express');
const router = express.Router();
const msmePmsSchemeController = require('../controllers/msmePmsSchemeController');
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('cloudinary').v2;

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
    cloudinary,
    params: async (req, file) => {
        return {
            folder: 'ihwe_psm_scheme',
            resource_type: 'auto',
            allowed_formats: ['pdf', 'jpg', 'jpeg', 'png', 'doc', 'docx'],
        };
    },
});

const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit per file
});

router.post('/apply', upload.array('documents', 5), msmePmsSchemeController.submitApplication);
router.post('/upload-image', upload.single('image'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No file uploaded' });
        }
        res.json({ success: true, url: req.file.path });
    } catch (error) {
        console.error('Error in upload-image:', error);
        res.status(500).json({ success: false, message: 'Image upload failed' });
    }
});
router.get('/all', msmePmsSchemeController.getAllApplications);
router.get('/page-content', msmePmsSchemeController.getPageContent);
router.post('/page-content', msmePmsSchemeController.updatePageContent);
router.get('/:id', msmePmsSchemeController.getApplicationById);
router.patch('/:id/status', msmePmsSchemeController.updateApplicationStatus);
router.delete('/:id', msmePmsSchemeController.deleteApplication);

module.exports = router;
