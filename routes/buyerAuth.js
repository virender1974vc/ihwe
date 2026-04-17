const express = require('express');
const router = express.Router();
const buyerAuthController = require('../controllers/buyerAuthController');
// const { protectBuyer } = require('../middleware/auth'); // If needed later

router.post('/login', (req, res) => buyerAuthController.login(req, res));
router.post('/send-mobile-otp', (req, res) => buyerAuthController.sendMobileOtp(req, res));
router.post('/verify-otp', (req, res) => buyerAuthController.verifyOtp(req, res));
// router.get('/dashboard', protectBuyer, (req, res) => buyerAuthController.getMyDashboard(req, res));

module.exports = router;
