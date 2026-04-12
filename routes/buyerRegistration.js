const express = require('express');
const router = express.Router();
const buyerRegistrationController = require('../controllers/buyerRegistrationController');
const buyerRegistrationConfigController = require('../controllers/buyerRegistrationConfigController');

// Configuration Routes
router.get('/config', (req, res) => buyerRegistrationConfigController.getConfig(req, res));
router.put('/config', (req, res) => buyerRegistrationConfigController.updateConfig(req, res));

// @route   POST /api/buyer-registration
// @desc    Submit a buyer registration
// @access  Public
router.post('/', (req, res) => buyerRegistrationController.createRegistration(req, res));

// @route   GET /api/buyer-registration
// @desc    Get all buyer registrations
// @access  Public (Should be protected)
router.get('/', (req, res) => buyerRegistrationController.getAllRegistrations(req, res));

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

module.exports = router;
