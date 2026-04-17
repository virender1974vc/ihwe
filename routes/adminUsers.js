const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const adminUsersController = require('../controllers/adminUsersController');

// Middleware to verify JWT token
const verifyToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ success: false, message: 'No token provided' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'ihwe_secret_2026');
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(401).json({ success: false, message: 'Token expired or invalid' });
    }
};

// @route   GET /api/admin/all
// @desc    Get all admin users
router.get('/all', verifyToken, (req, res) => adminUsersController.getAllAdmins(req, res));

// @route   GET /api/admin/public-list
// @desc    Get minimal public list of active admin users (for dropdowns)
router.get('/public-list', async (req, res) => {
    try {
        const User = require('../models/User');
        const users = await User.find({ status: 'Active' })
            .select('username fullName designation email mobile altMobile role')
            .sort({ fullName: 1 });
        res.json({ success: true, data: users });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// @route   GET /api/admin/by-username/:username
// @desc    Get a single admin user's public details by username (for RM card)
router.get('/by-username/:username', async (req, res) => {
    try {
        const User = require('../models/User');
        const user = await User.findOne({ username: req.params.username })
            .select('username fullName designation email mobile altMobile role');
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });
        res.json({ success: true, data: user });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// @route   POST /api/admin/create
// @desc    Create a new admin user
router.post('/create', verifyToken, (req, res) => adminUsersController.createAdmin(req, res));

// @route   PUT /api/admin/update/:id
// @desc    Update an admin user
router.put('/update/:id', verifyToken, (req, res) => adminUsersController.updateAdmin(req, res));

// @route   DELETE /api/admin/delete/:id
// @desc    Delete an admin user
router.delete('/delete/:id', verifyToken, (req, res) => adminUsersController.deleteAdmin(req, res));

module.exports = router;
