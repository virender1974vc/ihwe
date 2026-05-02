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

const upload = multer({ storage: speakerStorage });

const uploadFields = upload.fields([
    { name: 'speakerPhoto', maxCount: 1 },
    { name: 'companyLogo', maxCount: 1 },
    { name: 'presentation', maxCount: 1 },
]);

const router = express.Router();

router.post('/', uploadFields, createSpeaker);
router.get('/', getAllSpeakers);
router.get('/:id', getSpeakerById);
router.put('/:id/status', updateSpeakerStatus);
router.delete('/:id', deleteSpeaker);

module.exports = router;