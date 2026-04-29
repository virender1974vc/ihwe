const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const sellerPortalController = require('../controllers/sellerPortalController');
const { protectExhibitor } = require('../middleware/auth');

// ── Multer for document uploads ───────────────────────────────────────────────
const docStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = path.join(__dirname, '../uploads/seller-docs');
        if (!fs.existsSync(uploadPath)) fs.mkdirSync(uploadPath, { recursive: true });
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        cb(null, `doc-${Date.now()}${path.extname(file.originalname)}`);
    }
});
const uploadDoc = multer({ storage: docStorage, limits: { fileSize: 10 * 1024 * 1024 } });

// ── Admin routes (no exhibitor auth needed) ───────────────────────────────────
router.get('/admin/service-requests', async (req, res) => {
    try {
        const SellerServiceRequest = require('../models/SellerServiceRequest');
        const ExhibitorRegistration = require('../models/ExhibitorRegistration');

        const { type, status, search } = req.query;
        const filter = {};
        if (type && type !== 'all') filter.serviceType = type;
        if (status && status !== 'all') filter.status = status;

        const requests = await SellerServiceRequest.find(filter)
            .sort({ createdAt: -1 });

        // Populate exhibitor info
        const populated = await Promise.all(requests.map(async (req) => {
            const obj = req.toObject();
            try {
                const exhibitor = await ExhibitorRegistration.findById(req.exhibitorId)
                    .select('exhibitorName contact1 registrationId');
                obj.exhibitor = exhibitor ? {
                    name: exhibitor.exhibitorName,
                    email: exhibitor.contact1?.email,
                    mobile: exhibitor.contact1?.mobile,
                    registrationId: exhibitor.registrationId
                } : null;
            } catch (_) {}
            return obj;
        }));

        // Apply search filter after population
        const filtered = search
            ? populated.filter(r =>
                r.exhibitor?.name?.toLowerCase().includes(search.toLowerCase()) ||
                r.serviceName?.toLowerCase().includes(search.toLowerCase()) ||
                r.exhibitor?.registrationId?.toLowerCase().includes(search.toLowerCase())
            )
            : populated;

        res.json({ success: true, data: filtered, total: filtered.length });
    } catch (error) {
        console.error('Admin service requests error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch service requests' });
    }
});

// ── Admin: Export Inquiries ───────────────────────────────────────────────────
router.get('/admin/export-inquiries', async (req, res) => {
    try {
        const ExhibitorRegistration = require('../models/ExhibitorRegistration');
        const { status, search } = req.query;
        const filter = {};
        if (status && status !== 'all') filter.status = status;

        const inquiries = await ProductExportInquiry.find(filter).sort({ createdAt: -1 });

        const populated = await Promise.all(inquiries.map(async (inq) => {
            const obj = inq.toObject();
            try {
                const exhibitor = await ExhibitorRegistration.findById(inq.exhibitorId)
                    .select('exhibitorName contact1 registrationId');
                obj.exhibitor = exhibitor ? {
                    name: exhibitor.exhibitorName,
                    email: exhibitor.contact1?.email,
                    mobile: exhibitor.contact1?.mobile,
                    registrationId: exhibitor.registrationId
                } : null;
            } catch (_) {}
            return obj;
        }));

        const filtered = search
            ? populated.filter(r =>
                r.exhibitor?.name?.toLowerCase().includes(search.toLowerCase()) ||
                r.brandName?.toLowerCase().includes(search.toLowerCase()) ||
                r.exhibitor?.registrationId?.toLowerCase().includes(search.toLowerCase())
            )
            : populated;

        res.json({ success: true, data: filtered, total: filtered.length });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch export inquiries' });
    }
});

router.patch('/admin/export-inquiries/:id/status', async (req, res) => {
    try {
        const { status, adminNote } = req.body;
        const updated = await ProductExportInquiry.findByIdAndUpdate(
            req.params.id,
            { status, adminNote, updatedAt: new Date() },
            { new: true }
        );
        if (!updated) return res.status(404).json({ success: false, message: 'Inquiry not found' });
        res.json({ success: true, data: updated });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to update status' });
    }
});

router.patch('/admin/service-requests/:id/status', async (req, res) => {
    try {
        const SellerServiceRequest = require('../models/SellerServiceRequest');
        const { status, adminNote } = req.body;
        const updated = await SellerServiceRequest.findByIdAndUpdate(
            req.params.id,
            { status, adminNote, updatedAt: new Date() },
            { new: true }
        );
        if (!updated) return res.status(404).json({ success: false, message: 'Request not found' });
        res.json({ success: true, data: updated });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to update status' });
    }
});

// ── Exhibitor routes ──────────────────────────────────────────────────────────
router.use(protectExhibitor);
router.get('/subscription-info', sellerPortalController.getSubscriptionInfo);
router.get('/available-plans', sellerPortalController.getAvailablePlans);
router.get('/stats', sellerPortalController.getSellerStats);
router.get('/leads', sellerPortalController.getSellerLeads);
router.post('/export-inquiry', sellerPortalController.submitExportInquiry);
router.get('/export-inquiries', sellerPortalController.getExportInquiries);
router.post('/service-request', sellerPortalController.submitServiceRequest);
router.get('/service-requests', sellerPortalController.getServiceRequests);
router.get('/logistics-requests', sellerPortalController.getLogisticsRequests);
router.get('/conference-sessions', sellerPortalController.getConferenceSessions);
router.post('/conference-register', sellerPortalController.registerForSession);
router.get('/accessories', sellerPortalController.getAccessories);
router.post('/subscription/create-order', sellerPortalController.createSubscriptionOrder);
router.post('/subscription/verify-payment', sellerPortalController.verifySubscriptionPayment);

// Notifications
router.get('/notifications', sellerPortalController.getNotifications);
router.patch('/notifications/:id/read', sellerPortalController.markNotificationAsRead);
router.patch('/notifications/mark-all-read', sellerPortalController.markAllNotificationsAsRead);
router.delete('/notifications/:id', sellerPortalController.deleteNotification);

// Lead Actions
router.patch('/leads/:leadId/mark-interested', sellerPortalController.markLeadInterested);
router.post('/leads/:leadId/schedule-meeting', sellerPortalController.scheduleMeetingFromLead);
router.post('/leads/:leadId/send-brochure', sellerPortalController.sendBrochureToLead);
router.patch('/leads/:leadId/set-priority', sellerPortalController.setLeadPriority);
router.post('/leads/:leadId/convert-opportunity', sellerPortalController.convertLeadToOpportunity);

// Profile Management
router.get('/product-categories', sellerPortalController.getProductCategories);
router.post('/upload-document', uploadDoc.single('file'), sellerPortalController.uploadDocument);
router.put('/update-profile', sellerPortalController.updateSellerProfile);

// Meeting Stats
router.get('/meeting-stats', sellerPortalController.getMeetingStats);

// Stall Map
router.get('/stall-map', sellerPortalController.getStallMap);
router.post('/request-custom-space', sellerPortalController.requestCustomSpace);

// Marketing Assets
router.get('/marketing-assets', sellerPortalController.getMarketingAssets);
router.get('/marketing-assets/:assetId/download', sellerPortalController.downloadMarketingAsset);

// Meeting Types
router.get('/meeting-types', sellerPortalController.getMeetingTypes);
router.post('/schedule-meeting-with-type', sellerPortalController.scheduleMeetingWithType);

// Sponsorship Types
router.get('/sponsorship-types', sellerPortalController.getSponsorshipTypes);
router.post('/apply-sponsorship-with-type', sellerPortalController.applySponsorshipWithType);

module.exports = router;
