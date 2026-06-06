const express = require('express');
const router = express.Router();
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('cloudinary').v2;
const clientDocumentController = require('../controllers/clientDocumentController');

// Cloudinary Configuration
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Multer storage configuration for Cloudinary
const storage = new CloudinaryStorage({
    cloudinary,
    params: async (req, file) => {
        const ext = file.originalname.split('.').pop().toLowerCase();
        // Remove 'pdf' from isRaw so it is handled as 'auto' (image) to allow public iframe viewing
        const isRaw = ['doc', 'docx', 'xls', 'xlsx', 'csv', 'txt'].includes(ext);

        if (isRaw) {
            return {
                folder: 'client-documents',
                resource_type: 'raw', // Essential for non-image/video files like DOCX
                public_id: `${file.originalname.split('.')[0].replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}.${ext}`,
            };
        } else {
            return {
                folder: 'client-documents',
                resource_type: 'auto',
                allowed_formats: ['pdf', 'jpg', 'jpeg', 'png', 'gif', 'webp'], // Added pdf
                format: ext === 'pdf' ? undefined : ext, // Let Cloudinary auto-detect or keep original format for pdf
            };
        }
    },
});

const upload = multer({ storage: storage });

// Routes
router.post('/upload', upload.single('file'), clientDocumentController.uploadClientDocument);
router.get('/proxy/download', clientDocumentController.downloadProxy);
router.get('/:client_id', clientDocumentController.getClientDocuments);
router.patch('/:id/status', clientDocumentController.updateDocumentStatus);
router.post('/:id/comment', clientDocumentController.addDocumentComment);
router.delete('/:id', clientDocumentController.deleteClientDocument);

module.exports = router;
