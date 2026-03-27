const express = require('express');
const router = express.Router();
const verifyController = require('../controllers/verifyController');

// @route   POST /api/verify/send-email-otp
router.post('/send-email-otp', (req, res) => verifyController.sendEmailOtp(req, res));

// @route   POST /api/verify/verify-email-otp
router.post('/verify-email-otp', (req, res) => verifyController.verifyEmailOtp(req, res));

// @route   POST /api/verify/send-phone-otp
router.post('/send-phone-otp', (req, res) => verifyController.sendPhoneOtp(req, res));

// @route   POST /api/verify/verify-phone-otp
router.post('/verify-phone-otp', (req, res) => verifyController.verifyPhoneOtp(req, res));

module.exports = router;
