const express = require('express');
const router = express.Router();
const otpController = require('../controllers/otpController');

// @route   POST /api/otp/request
// @desc    Request OTP for email or phone
router.post('/request', otpController.requestOtp);

// @route   POST /api/otp/verify
// @desc    Verify OTP
router.post('/verify', otpController.verifyOtp);

module.exports = router;
