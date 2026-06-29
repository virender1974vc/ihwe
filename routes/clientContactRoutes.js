const express = require('express');
const router = express.Router();
const clientContactController = require('../controllers/clientContactController');
const { authMiddleware } = require('../middleware/authMiddleware');

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
    params: {
        folder: 'client_contacts',
        allowed_formats: ['jpg', 'png', 'jpeg', 'pdf', 'webp'],
        resource_type: 'auto'
    }
});
const upload = multer({ storage });
const uploadMiddleware = (req, res, next) => {
    upload.single('photo')(req, res, function (err) {
        if (err) {
            console.error("Cloudinary upload error:", err);
            return res.status(500).json({ success: false, message: "File upload failed", error: err.message || err });
        }
        next();
    });
};

router.get('/:clientId', authMiddleware, clientContactController.getClientContacts);
router.put('/:clientId/contacts', authMiddleware, clientContactController.updateClientContacts);
router.post('/admin-upload-photo', authMiddleware, uploadMiddleware, clientContactController.adminUploadPhoto);
module.exports = router;
