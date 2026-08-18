const express = require('express');
const router = express.Router();
const msmePmsSchemeController = require('../controllers/msmePmsSchemeController');
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('cloudinary').v2;
const { protectExhibitor } = require('../middleware/auth');
const mongoose = require('mongoose');
const ExhibitorRegistration = require('../models/ExhibitorRegistration');

const normalizeEmail = value => String(value || '').trim().toLowerCase();
const normalizeMobile = value => String(value || '').replace(/\D/g, '').slice(-10);
const resolveSelectedExhibitor = async (req, res, next) => {
    try {
        const selectedId = req.query.exhibitorId;
        if (!selectedId || String(selectedId) === String(req.user.id)) return next();
        if (!mongoose.isValidObjectId(selectedId)) return res.status(400).json({ success: false, message: 'Invalid exhibitor selection' });
        const selected = await ExhibitorRegistration.findById(selectedId).select('contact1.email contact1.mobile');
        if (!selected) return res.status(404).json({ success: false, message: 'Selected exhibitor not found' });
        const ownsByEmail = normalizeEmail(req.user.email) && normalizeEmail(req.user.email) === normalizeEmail(selected.contact1?.email);
        const ownsByMobile = normalizeMobile(req.user.mobile) && normalizeMobile(req.user.mobile) === normalizeMobile(selected.contact1?.mobile);
        if (!ownsByEmail && !ownsByMobile) return res.status(403).json({ success: false, message: 'You cannot access this exhibitor application' });
        req.user = { ...req.user, id: String(selected._id) };
        next();
    } catch (error) {
        res.status(500).json({ success: false, message: 'Could not resolve selected exhibitor' });
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
            folder: 'ihwe_psm_scheme',
            resource_type: 'auto',
            allowed_formats: ['pdf', 'jpg', 'jpeg', 'png', 'doc', 'docx'],
        };
    },
});

const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const allowed = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
        cb(allowed.includes(file.mimetype) ? null : new Error('Only PDF, JPG and PNG files are allowed'), allowed.includes(file.mimetype));
    }
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
// Admin Book a Stand: verify + extract a Udyam certificate before an
// ExhibitorRegistration exists yet (so it can't be tied to one).
router.post('/verify-udyam-certificate', upload.single('file'), msmePmsSchemeController.verifyUdyamCertificateStandalone);
// Authenticated exhibitor dashboard workflow. Keep these before /:id.
router.get('/application/me', protectExhibitor, resolveSelectedExhibitor, msmePmsSchemeController.getMyApplication);
router.put('/application/step/:step', protectExhibitor, resolveSelectedExhibitor, msmePmsSchemeController.saveApplicationStep);
router.post('/application/documents/:documentType', protectExhibitor, resolveSelectedExhibitor, upload.single('file'), msmePmsSchemeController.uploadApplicationDocument);
router.delete('/application/documents/:documentType', protectExhibitor, resolveSelectedExhibitor, msmePmsSchemeController.deleteApplicationDocument);
router.post('/application/submit', protectExhibitor, resolveSelectedExhibitor, msmePmsSchemeController.submitMyApplication);
router.get('/all', msmePmsSchemeController.getAllApplications);
router.get('/page-content', msmePmsSchemeController.getPageContent);
router.post('/page-content', msmePmsSchemeController.updatePageContent);
router.get('/:id/edit', msmePmsSchemeController.getOrCreateApplicationForAdmin);
router.put('/:id/step/:step', msmePmsSchemeController.saveApplicationStepById.bind(msmePmsSchemeController));
router.post('/:id/documents/:documentType', upload.single('file'), msmePmsSchemeController.uploadApplicationDocumentById.bind(msmePmsSchemeController));
router.delete('/:id/documents/:documentType', msmePmsSchemeController.deleteApplicationDocumentById.bind(msmePmsSchemeController));
router.post('/:id/submit', msmePmsSchemeController.submitApplicationById.bind(msmePmsSchemeController));
router.get('/:id', msmePmsSchemeController.getApplicationById);
router.patch('/:id/status', msmePmsSchemeController.updateApplicationStatus);
router.patch('/:id/stage', msmePmsSchemeController.updatePmsStage);
router.patch('/:id/portal', msmePmsSchemeController.updateMsmePortal);
router.post('/:id/portal-acknowledgement', upload.single('file'), msmePmsSchemeController.uploadPortalAcknowledgement);
router.patch('/:id/documents/:documentId/status', msmePmsSchemeController.updateDocumentStatus);
router.patch('/:id/documents/:documentType/not-applicable', msmePmsSchemeController.markDocumentNotApplicable);
router.patch('/:id/udyam-details', msmePmsSchemeController.updateUdyamDetails);
router.patch('/:id/portal-otp-contact', msmePmsSchemeController.updatePortalOtpContact);
router.post('/:id/ai-screening', msmePmsSchemeController.runAiScreening);
router.patch('/:id/action-required', msmePmsSchemeController.setActionRequired);
router.delete('/:id', msmePmsSchemeController.deleteApplication);

module.exports = router;
