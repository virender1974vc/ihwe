const express = require('express');
const router = express.Router();
const penaltyController = require('../controllers/penaltyController');
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

// @route   POST /api/penalty/add/:registrationId
router.post('/add/:registrationId', requireAdminAuth, penaltyController.addPenalty);

// @route   PUT /api/penalty/update/:registrationId
router.put('/update/:registrationId', requireAdminAuth, penaltyController.updatePenalty);

// @route   DELETE /api/penalty/remove/:registrationId
router.delete('/remove/:registrationId', requireAdminAuth, penaltyController.removePenalty);

// @route   GET /api/penalty/history/:registrationId
router.get('/history/:registrationId', requireAdminAuth, penaltyController.getPenaltyHistory);

module.exports = router;
