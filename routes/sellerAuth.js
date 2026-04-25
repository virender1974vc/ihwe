const express = require('express');
const router = express.Router();
const sellerAuthController = require('../controllers/sellerAuthController');
// const { protectSeller } = require('../middleware/auth'); // If needed later

router.post('/login', (req, res) => sellerAuthController.login(req, res));
router.post('/send-mobile-otp', (req, res) => sellerAuthController.sendMobileOtp(req, res));
router.post('/verify-otp', (req, res) => sellerAuthController.verifyOtp(req, res));
// router.get('/dashboard', protectSeller, (req, res) => sellerAuthController.getMyDashboard(req, res));

module.exports = router;
