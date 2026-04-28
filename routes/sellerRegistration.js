const express = require('express');
const router = express.Router();
const sellerRegistrationController = require('../controllers/sellerRegistrationController');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure upload directories exist
const paymentDir = 'uploads/payments';
const profileDir = 'uploads/profiles';
[paymentDir, profileDir].forEach(dir => {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        if (file.fieldname === 'paymentProof') {
            cb(null, paymentDir);
        } else {
            cb(null, profileDir);
        }
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});

const upload = multer({ storage });

// Public Routes
router.post('/', upload.fields([
    { name: 'paymentProof', maxCount: 1 },
    { name: 'companyCatalog', maxCount: 1 }
]), sellerRegistrationController.createRegistration);

router.post('/create-order', sellerRegistrationController.createOrder);
router.post('/verify-payment', sellerRegistrationController.verifyPayment);

// Admin / Internal Routes (Should be protected by auth middleware in a real app)
router.get('/', sellerRegistrationController.getAllRegistrations);
router.get('/stats', sellerRegistrationController.getStats);
router.get('/:id', sellerRegistrationController.getRegistrationById);
router.put('/:id', sellerRegistrationController.updateRegistration);
router.delete('/:id', sellerRegistrationController.deleteRegistration);

module.exports = router;
