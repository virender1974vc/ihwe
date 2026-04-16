const express = require('express');
const router = express.Router();
const buyerRegistrationController = require('../controllers/buyerRegistrationController');
const buyerRegistrationConfigController = require('../controllers/buyerRegistrationConfigController');
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const folder = file.fieldname === 'companyProfile' ? 'uploads/profiles' : 'uploads/payments';
        cb(null, folder);
    },
    filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
});
const upload = multer({ storage });

const BuyerRegistration = require('../models/BuyerRegistration');

// Configuration Routes
router.get('/config', (req, res) => buyerRegistrationConfigController.getConfig(req, res));
router.put('/config', (req, res) => buyerRegistrationConfigController.updateConfig(req, res));

// ➤ Public: lookup buyer by registrationId (for QR scan) — before /:id
router.get('/scan/:registrationId', async (req, res) => {
    try {
        const buyer = await BuyerRegistration.findOne({
            registrationId: req.params.registrationId
        }).select('-__v -companyProfile -paymentProof');
        if (!buyer) return res.status(404).json({ success: false, message: 'Buyer not found' });
        res.json({ success: true, data: buyer });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// @route   POST /api/buyer-registration
// @desc    Submit a buyer registration
// @access  Public
router.post('/', upload.fields([
    { name: 'paymentProof', maxCount: 1 },
    { name: 'companyProfile', maxCount: 1 }
]), (req, res) => buyerRegistrationController.createRegistration(req, res));

// @route   GET /api/buyer-registration
// @desc    Get all buyer registrations
// @access  Public (Should be protected)
router.get('/', (req, res) => buyerRegistrationController.getAllRegistrations(req, res));

// @route   GET /api/buyer-registration/stats
router.get('/stats', (req, res) => buyerRegistrationController.getStats(req, res));

// @route   GET /api/buyer-registration/:id
// @desc    Get a single buyer registration
// @access  Public (Should be protected)
router.get('/:id', (req, res) => buyerRegistrationController.getRegistrationById(req, res));

// @route   PUT /api/buyer-registration/:id
// @desc    Update a buyer registration
// @access  Public (Should be protected)
router.put('/:id', (req, res) => buyerRegistrationController.updateRegistration(req, res));

// @route   DELETE /api/buyer-registration/:id
// @desc    Delete a buyer registration
// @access  Public (Should be protected)
router.delete('/:id', (req, res) => buyerRegistrationController.deleteRegistration(req, res));

// @route   POST /api/buyer-registration/create-order
router.post('/create-order', (req, res) => buyerRegistrationController.createOrder(req, res));

// @route   POST /api/buyer-registration/verify-payment
router.post('/verify-payment', (req, res) => buyerRegistrationController.verifyPayment(req, res));

// @route   POST /api/buyer-registration/login
router.post('/login', (req, res) => buyerRegistrationController.login(req, res));

module.exports = router;
