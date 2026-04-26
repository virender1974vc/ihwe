const express = require('express');
const router = express.Router();
const sellerPortalController = require('../controllers/sellerPortalController');
const { protectExhibitor } = require('../middleware/auth');
router.use(protectExhibitor);
router.get('/subscription-info', sellerPortalController.getSubscriptionInfo);
router.get('/available-plans', sellerPortalController.getAvailablePlans);
router.get('/stats', sellerPortalController.getSellerStats);
router.get('/leads', sellerPortalController.getSellerLeads);
router.post('/export-inquiry', sellerPortalController.submitExportInquiry);
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
router.post('/upload-document', sellerPortalController.uploadDocument);
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
