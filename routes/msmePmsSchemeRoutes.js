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

module.exports = router;
