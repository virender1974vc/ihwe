const express = require('express');
const router = express.Router();
const exhibitorRegistrationController = require('../controllers/exhibitorRegistrationController');
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('cloudinary').v2;
const jwt = require('jsonwebtoken');
const requireAdminAuth = (req, res, next) => {
    const auth = req.headers.authorization;
    if (!auth || !auth.startsWith('Bearer '))
        return res.status(401).json({ success: false, message: 'Unauthorized' });
    try {
        const decoded = jwt.verify(auth.split(' ')[1], process.env.JWT_SECRET || 'fallback_secret_key');
        if (decoded.role === 'exhibitor')
            return res.status(403).json({ success: false, message: 'Exhibitor access not allowed' });
        req.user = decoded;
        next();
    } catch {
        return res.status(401).json({ success: false, message: 'Invalid token' });
    }
};
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
    cloudinary,
    params: async (req, file) => {
        return {
            folder: 'receipts',
            resource_type: 'image',
            allowed_formats: ['jpg', 'jpeg', 'png'],
        };
    },
});

const upload = multer({ storage });

router.get('/', (req, res) => exhibitorRegistrationController.getAllRegistrations(req, res));
router.get('/:id', (req, res) => exhibitorRegistrationController.getRegistrationById(req, res));
router.post('/', (req, res) => exhibitorRegistrationController.addRegistration(req, res));
router.put('/:id', (req, res) => exhibitorRegistrationController.updateRegistration(req, res));
router.delete('/:id', (req, res) => exhibitorRegistrationController.deleteRegistration(req, res));

// Per-field KYC document upload (admin only) — uploads to Cloudinary, saves to THIS registration only
// Local Storage for Special Documents and KYC to avoid Cloudinary issues
const kycDiskStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = 'uploads/kyc';
        const fs = require('fs');
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, 'ihwe-' + uniqueSuffix + '-' + file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_'));
    }
});
const kycUpload = multer({ storage: kycDiskStorage });
const kycStorage = null; // Removed Cloudinary

// KYC document configuration
const kycFields = kycUpload.fields([
    { name: 'companyLogo', maxCount: 1 },
    { name: 'panCardFront', maxCount: 1 },
    { name: 'aadhaarCardFront', maxCount: 1 },
    { name: 'aadhaarCardBack', maxCount: 1 },
    { name: 'gstCertificate', maxCount: 1 },
    { name: 'cancelledCheque', maxCount: 1 },
    { name: 'representativePhoto', maxCount: 1 }
]);

router.put('/:id/kyc-doc', requireAdminAuth, kycFields, (req, res) => exhibitorRegistrationController.updateKycDocs(req, res));
router.delete('/:id/kyc-doc/:field', requireAdminAuth, (req, res) => exhibitorRegistrationController.deleteKycDoc(req, res));
router.post('/bulk-cleanup-docs', requireAdminAuth, (req, res) => exhibitorRegistrationController.cleanupAllKycDocs(req, res));
router.post('/:id/special-docs', kycUpload.single('file'), (req, res) => exhibitorRegistrationController.addSpecialDoc(req, res));
router.delete('/:id/special-docs/:docId', (req, res) => exhibitorRegistrationController.deleteSpecialDoc(req, res));
router.post('/upload-receipt', requireAdminAuth, upload.single('receipt'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ success: false, message: 'No file uploaded' });
    }
    res.status(200).json({ success: true, url: req.file.path });
});
// MSME Certificate upload (exhibitor or admin)
const msmeStorage = new CloudinaryStorage({
    cloudinary,
    params: async (req, file) => {
        return {
            folder: 'msme-certificates',
            resource_type: 'image',
            allowed_formats: ['jpg', 'jpeg', 'png'],
        };
    },
});
const msmeUpload = multer({ storage: msmeStorage });


router.put('/:id/msme', msmeUpload.single('udyamCertificate'), async (req, res) => {
    try {
        const msmeData = { ...req.body, updatedAt: new Date() };
        if (req.file) msmeData.udyamCertificateUrl = req.file.path;
        const updated = await require('../models/ExhibitorRegistration').findByIdAndUpdate(
            req.params.id,
            { msme: msmeData },
            { new: true }
        );
        if (!updated) return res.status(404).json({ success: false, message: 'Registration not found' });
        res.json({ success: true, data: updated.msme });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});
module.exports = router;