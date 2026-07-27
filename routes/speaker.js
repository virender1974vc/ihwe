const express = require('express');
const { createSpeaker, getAllSpeakers, getSpeakerById, updateSpeakerStatus, deleteSpeaker } = require('../controllers/speakerController.js');
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('cloudinary').v2;

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

const speakerStorage = new CloudinaryStorage({
    cloudinary,
    params: async (req, file) => {
        const isPDF = file.mimetype === 'application/pdf';
        const isPPT = file.originalname.match(/\.(ppt|pptx)$/i);
        return {
            folder: 'speaker-nominations',
            resource_type: (isPDF || isPPT) ? 'raw' : 'image',
            allowed_formats: ['jpg', 'jpeg', 'png', 'pdf', 'ppt', 'pptx'],
        };
    },
});

const upload = multer({
    storage: speakerStorage,
    limits: {
        fileSize: 10 * 1024 * 1024,
    },
    fileFilter: (req, file, cb) => {
        const allowedMimeTypes = [
            'image/jpeg',
            'image/png',
            'application/pdf',
            'application/vnd.ms-powerpoint',
            'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        ];

        if (allowedMimeTypes.includes(file.mimetype)) {
            return cb(null, true);
        }

        cb(new Error('Only JPG, PNG, PDF, PPT and PPTX files are allowed.'));
    },
});

const uploadFields = upload.fields([
    { name: 'speakerPhoto', maxCount: 1 },
    { name: 'companyLogo', maxCount: 1 },
    { name: 'presentation', maxCount: 1 },
]);

const handleUpload = (req, res, next) => {
    uploadFields(req, res, (error) => {
        if (!error) return next();

        const message = error.code === 'LIMIT_FILE_SIZE'
            ? 'Uploaded files must be 10MB or smaller.'
            : error.message || 'Failed to upload speaker files.';

        return res.status(400).json({
            success: false,
            message,
        });
    });
};

const router = express.Router();

router.post('/', handleUpload, createSpeaker);
router.get('/', getAllSpeakers);
router.get('/:id', getSpeakerById);
router.put('/:id/status', updateSpeakerStatus);
router.delete('/:id', deleteSpeaker);

module.exports = router;
