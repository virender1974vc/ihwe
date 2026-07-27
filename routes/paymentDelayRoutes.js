const express = require('express');
const router = express.Router();
const paymentDelayController = require('../controllers/paymentDelayController');
const jwt = require('jsonwebtoken');

// Admin auth middleware (same pattern as rest of the app)
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

// @route   GET /api/payment-delay/overdue
router.get('/overdue', requireAdminAuth, paymentDelayController.getOverduePayments);

// @route   POST /api/payment-delay/send-warning/:registrationId
router.post('/send-warning/:registrationId', requireAdminAuth, paymentDelayController.sendWarning);

// @route   POST /api/payment-delay/bulk-warning
router.post('/bulk-warning', requireAdminAuth, paymentDelayController.sendBulkWarnings);

// @route   PUT /api/payment-delay/due-date/:registrationId
router.put('/due-date/:registrationId', requireAdminAuth, paymentDelayController.updateDueDate);

// @route   GET /api/payment-delay/warning-history/:registrationId
router.get('/warning-history/:registrationId', requireAdminAuth, paymentDelayController.getWarningHistory);

module.exports = router;
