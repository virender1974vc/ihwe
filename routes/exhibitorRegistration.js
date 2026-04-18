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
router.post('/:id/sync', (req, res) => exhibitorRegistrationController.syncProfileData(req, res));
router.post('/:id/force-docs', (req, res) => exhibitorRegistrationController.forceDocs(req, res));

// Per-field KYC document upload (admin only) — uploads to Cloudinary, saves to THIS registration only
const kycStorage = new CloudinaryStorage({
    cloudinary,
    params: async (req, file) => ({
        folder: 'exhibitor-docs',
        resource_type: 'auto',
        allowed_formats: ['jpg', 'jpeg', 'png', 'pdf'],
    }),
});
const kycUpload = multer({ storage: kycStorage });

const ALLOWED_KYC_FIELDS = ['companyLogoUrl','panCardFrontUrl','panCardBackUrl','aadhaarCardFrontUrl','aadhaarCardBackUrl','gstCertificateUrl','cancelledChequeUrl','representativePhotoUrl'];

router.put('/:id/kyc-doc', requireAdminAuth, kycUpload.single('file'), async (req, res) => {
    try {
        const { field } = req.body;
        if (!ALLOWED_KYC_FIELDS.includes(field)) return res.status(400).json({ success: false, message: 'Invalid field name' });
        if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });
        const ExhibitorRegistration = require('../models/ExhibitorRegistration');
        const updated = await ExhibitorRegistration.findByIdAndUpdate(
            req.params.id,
            { $set: { [field]: req.file.path, updatedAt: new Date() } },
            { new: true }
        );
        if (!updated) return res.status(404).json({ success: false, message: 'Registration not found' });
        res.json({ success: true, url: req.file.path, data: updated });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

router.delete('/:id/kyc-doc/:field', requireAdminAuth, async (req, res) => {
    try {
        const { field } = req.params;
        if (!ALLOWED_KYC_FIELDS.includes(field)) return res.status(400).json({ success: false, message: 'Invalid field name' });
        const ExhibitorRegistration = require('../models/ExhibitorRegistration');
        const updated = await ExhibitorRegistration.findByIdAndUpdate(
            req.params.id,
            { $unset: { [field]: '' }, $set: { updatedAt: new Date() } },
            { new: true }
        );
        if (!updated) return res.status(404).json({ success: false, message: 'Registration not found' });
        res.json({ success: true, data: updated });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});
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


router.put('/:id/msme', msmeUpload.single('udhyamCertificate'), async (req, res) => {
    try {
        const msmeData = { ...req.body, updatedAt: new Date() };
        if (req.file) msmeData.udhyamCertificateUrl = req.file.path;
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