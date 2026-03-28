const express = require('express');
const router = express.Router();
const exhibitorAuthController = require('../controllers/exhibitorAuthController');
const { protectExhibitor } = require('../middleware/auth');

router.post('/login', (req, res) => exhibitorAuthController.login(req, res));
router.post('/verify-otp', (req, res) => exhibitorAuthController.verifyOtp(req, res));
router.get('/dashboard', protectExhibitor, (req, res) => exhibitorAuthController.getMyDashboard(req, res));
router.post('/change-password', protectExhibitor, (req, res) => exhibitorAuthController.changePassword(req, res));

module.exports = router;
