const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/stallProductController');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = './uploads/stall-products';
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname.replace(/\s+/g, '_')}`);
    }
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });
const requireExhibitor = (req, res, next) => {
    const auth = req.headers.authorization;
    if (!auth?.startsWith('Bearer '))
        return res.status(401).json({ success: false, message: 'Unauthorized' });
    try {
        const decoded = jwt.verify(auth.split(' ')[1], process.env.JWT_SECRET || 'fallback_secret_key');
        if (decoded.role !== 'exhibitor')
            return res.status(403).json({ success: false, message: 'Exhibitor access only' });
        req.user = decoded;
        next();
    } catch {
        return res.status(401).json({ success: false, message: 'Invalid token' });
    }
};
const requireAdmin = (req, res, next) => {
    const auth = req.headers.authorization;
    if (!auth?.startsWith('Bearer ')) return res.status(401).json({ success: false, message: 'Unauthorized' });
    try {
        const decoded = jwt.verify(auth.split(' ')[1], process.env.JWT_SECRET || 'fallback_secret_key');
        if (decoded.role !== 'admin' && decoded.role !== 'super-admin')
            return res.status(403).json({ success: false, message: 'Admin access only' });
        req.user = decoded;
        next();
    } catch {
        return res.status(401).json({ success: false, message: 'Invalid token' });
    }
};

router.get('/my', requireExhibitor, ctrl.getMyProducts);
router.post('/', requireExhibitor, upload.array('images', 8), ctrl.addProduct);
router.put('/:id', requireExhibitor, upload.array('images', 8), ctrl.updateProduct);
router.delete('/:id', requireExhibitor, ctrl.deleteProduct);
router.get('/:id/enquiries', requireExhibitor, ctrl.getProductEnquiries);
router.get('/analytics/summary', requireExhibitor, ctrl.getAnalytics);
router.post('/:id/view', ctrl.recordView);
router.post('/:id/enquiry', ctrl.submitEnquiry);

// Admin Routes
router.get('/admin/exhibitor/:exhibitorId', requireAdmin, ctrl.getExhibitorProductsAdmin);
router.get('/admin/analytics/:exhibitorId', requireAdmin, ctrl.getExhibitorAnalyticsAdmin);
router.post('/admin/add', requireAdmin, upload.array('images', 8), ctrl.addProductAdmin);
router.delete('/admin/:id', requireAdmin, ctrl.deleteProductAdmin);

module.exports = router;
