const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const mediaRegistrationController = require('../controllers/mediaRegistrationController');
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        let dir = './uploads/media-registration';
        if (file.mimetype.startsWith('image/')) {
            dir = './uploads/media-registration/images';
        } else if (file.mimetype === 'application/pdf') {
            dir = './uploads/media-registration/docs';
        } else if (file.mimetype.startsWith('video/')) {
            dir = './uploads/media-registration/videos';
        }

        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 100 * 1024 * 1024 }
});

router.post('/upload', upload.single('file'), (req, res) => {
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });
    const filePath = req.file.path.replace(/\\/g, '/').replace(/^uploads/, '/uploads');
    const normalizedPath = filePath.startsWith('/') ? filePath : `/${filePath}`;
    res.status(200).json({ success: true, url: normalizedPath });
});

router.get('/data', mediaRegistrationController.getMediaPageData);
router.post('/enquiry', mediaRegistrationController.submitMediaEnquiry);
router.get('/press-releases', mediaRegistrationController.getPressReleases);
router.post('/press-releases', mediaRegistrationController.createPressRelease);
router.put('/press-releases/:id', mediaRegistrationController.updatePressRelease);
router.delete('/press-releases/:id', mediaRegistrationController.deletePressRelease);
router.get('/videos', mediaRegistrationController.getVideos);
router.post('/videos', mediaRegistrationController.createVideo);
router.put('/videos/:id', mediaRegistrationController.updateVideo);
router.delete('/videos/:id', mediaRegistrationController.deleteVideo);
router.get('/coverage', mediaRegistrationController.getCoverage);
router.post('/coverage', mediaRegistrationController.createCoverage);
router.put('/coverage/:id', mediaRegistrationController.updateCoverage);
router.delete('/coverage/:id', mediaRegistrationController.deleteCoverage);
router.get('/partners', mediaRegistrationController.getPartners);
router.post('/partners', mediaRegistrationController.createPartner);
router.put('/partners/:id', mediaRegistrationController.updatePartner);
router.delete('/partners/:id', mediaRegistrationController.deletePartner);
router.get('/resources', mediaRegistrationController.getResources);
router.post('/resources', mediaRegistrationController.createResource);
router.put('/resources/:id', mediaRegistrationController.updateResource);
router.delete('/resources/:id', mediaRegistrationController.deleteResource);
router.get('/banner-logos', mediaRegistrationController.getBannerLogos);
router.post('/banner-logos', mediaRegistrationController.createBannerLogo);
router.put('/banner-logos/:id', mediaRegistrationController.updateBannerLogo);
router.delete('/banner-logos/:id', mediaRegistrationController.deleteBannerLogo);

// Banner Settings
router.get('/banner-settings', mediaRegistrationController.getBannerSettings);
router.put('/banner-settings', mediaRegistrationController.updateBannerSettings);

module.exports = router;