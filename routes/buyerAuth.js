const express = require('express');
const router = express.Router();
const buyerAuthController = require('../controllers/buyerAuthController');
const { protectBuyer } = require('../middleware/auth');

router.post('/login', (req, res) => buyerAuthController.login(req, res));
router.post('/send-mobile-otp', (req, res) => buyerAuthController.sendMobileOtp(req, res));
router.post('/verify-otp', (req, res) => buyerAuthController.verifyOtp(req, res));
router.get('/dashboard', protectBuyer, (req, res) => buyerAuthController.getMyDashboard(req, res));
router.post('/change-password', protectBuyer, (req, res) => buyerAuthController.changePassword(req, res));
router.put('/update-profile', protectBuyer, (req, res) => buyerAuthController.updateProfile(req, res));

module.exports = router;
