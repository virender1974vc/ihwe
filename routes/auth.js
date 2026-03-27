const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { verifyToken } = require('../utils/verifyToken');

// @route   POST /api/register
router.post('/register', (req, res) => authController.register(req, res));

// @route   POST /api/login
router.post('/login', (req, res) => authController.login(req, res));

// @route   POST /api/logout
router.post('/logout', (req, res) => authController.logout(req, res));

// @route   GET /api/verify-token
router.get('/verify-token', (req, res) => authController.verifyToken(req, res));

// @route   PUT /api/admin/change-password
router.put('/admin/change-password', verifyToken, (req, res) => authController.changePassword(req, res));

module.exports = router;