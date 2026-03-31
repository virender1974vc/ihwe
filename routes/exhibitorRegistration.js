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
        const isPdf = file.mimetype === 'application/pdf';
        return {
            folder: 'receipts',
            resource_type: isPdf ? 'raw' : 'image',
            allowed_formats: ['jpg', 'jpeg', 'png', 'pdf'],
        };
    },
});

const upload = multer({ storage });

router.get('/', (req, res) => exhibitorRegistrationController.getAllRegistrations(req, res));
router.post('/', (req, res) => exhibitorRegistrationController.addRegistration(req, res));
router.put('/:id', (req, res) => exhibitorRegistrationController.updateRegistration(req, res));
router.delete('/:id', (req, res) => exhibitorRegistrationController.deleteRegistration(req, res));
router.post('/upload-receipt', requireAdminAuth, upload.single('receipt'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ success: false, message: 'No file uploaded' });
    }
    res.status(200).json({ success: true, url: req.file.path });
});
module.exports = router;