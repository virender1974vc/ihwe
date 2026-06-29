const express = require('express');
const router = express.Router();
const exhibitorAuthController = require('../controllers/exhibitorAuthController');
const { protectExhibitor } = require('../middleware/auth');
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
    params: async (req, file) => ({
        folder: 'exhibitor-docs',
        resource_type: 'auto',
        allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'pdf'],
    }),
});

const upload = multer({ storage });

const uploadFields = upload.fields([
    { name: 'companyLogo', maxCount: 1 },
    { name: 'panCardFront', maxCount: 1 },
    { name: 'aadhaarCardFront', maxCount: 1 },
    { name: 'aadhaarCardBack', maxCount: 1 },
    { name: 'gstCertificate', maxCount: 1 },
    { name: 'cancelledCheque', maxCount: 1 },
    { name: 'representativePhoto', maxCount: 1 }
]);

router.post('/login', (req, res) => exhibitorAuthController.login(req, res));
router.post('/send-email-otp', (req, res) => exhibitorAuthController.sendEmailOtp(req, res));
router.post('/send-mobile-otp', (req, res) => exhibitorAuthController.sendMobileOtp(req, res));
router.post('/verify-otp', (req, res) => exhibitorAuthController.verifyOtp(req, res));
router.get('/dashboard', protectExhibitor, (req, res) => exhibitorAuthController.getMyDashboard(req, res));
router.get('/updates', protectExhibitor, (req, res) => exhibitorAuthController.getUpdates(req, res));
router.post('/change-password', protectExhibitor, (req, res) => exhibitorAuthController.changePassword(req, res));
router.post('/pass-order', protectExhibitor, (req, res) => exhibitorAuthController.createPassOrder(req, res));
router.post('/pass-request', protectExhibitor, (req, res) => exhibitorAuthController.requestPass(req, res));
router.post('/team-member-photo', protectExhibitor, (req, res, next) => {
    upload.single('photo')(req, res, (err) => {
        if (err) {
            console.error('Team member photo upload error:', err);
            return res.status(400).json({
                success: false,
                message: 'Photo upload failed: ' + err.message
            });
        }
        next();
    });
}, (req, res) => exhibitorAuthController.uploadTeamMemberPhoto(req, res));
router.put('/update-profile', protectExhibitor, (req, res, next) => {
    uploadFields(req, res, (err) => {
        if (err) {
            console.error('Multer/Cloudinary Error:', err);
            return res.status(400).json({ 
                success: false, 
                message: 'File upload failed: ' + err.message 
            });
        }
        next();
    });
}, (req, res) => exhibitorAuthController.updateProfile(req, res));
router.post('/register-seller', protectExhibitor, (req, res) => exhibitorAuthController.registerSeller(req, res));

module.exports = router;
