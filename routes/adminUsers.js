const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');

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
router.get('/all', verifyToken, async (req, res) => {
    try {
        const admins = await User.find().select('-password').sort({ createdAt: 1 });
        res.json({ success: true, data: admins });
    } catch (error) {
        console.error('Fetch admins error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// @route   POST /api/admin/create
// @desc    Create a new admin user
router.post('/create', verifyToken, async (req, res) => {
    try {
        const { username, password, role } = req.body;

        if (!username || !password) {
            return res.status(400).json({ success: false, message: 'Username and password are required' });
        }

        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(409).json({ success: false, message: 'Username already exists' });
        }

        const newAdmin = new User({
            username,
            password,
            role: role || 'Editor',
            status: 'Active'
        });

        await newAdmin.save();

        const adminData = newAdmin.toObject();
        delete adminData.password;

        res.status(201).json({ success: true, message: 'Admin created successfully', data: adminData });
    } catch (error) {
        console.error('Create admin error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// @route   PUT /api/admin/update/:id
// @desc    Update an admin user
router.put('/update/:id', verifyToken, async (req, res) => {
    try {
        const { username, role, status, password } = req.body;
        const adminId = req.params.id;

        const admin = await User.findById(adminId);
        if (!admin) {
            return res.status(404).json({ success: false, message: 'Admin not found' });
        }

        // If username is changing, check for duplicate
        if (username && username !== admin.username) {
            const existingUser = await User.findOne({ username });
            if (existingUser) {
                return res.status(409).json({ success: false, message: 'Username already exists' });
            }
            admin.username = username;
        }

        if (role) admin.role = role;
        if (status) admin.status = status;
        if (password) admin.password = password; // Will be hashed by pre-save hook

        await admin.save();

        const adminData = admin.toObject();
        delete adminData.password;

        res.json({ success: true, message: 'Admin updated successfully', data: adminData });
    } catch (error) {
        console.error('Update admin error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// @route   DELETE /api/admin/delete/:id
// @desc    Delete an admin user
router.delete('/delete/:id', verifyToken, async (req, res) => {
    try {
        const adminId = req.params.id;

        // Prevent self-deletion
        if (req.user && req.user.id === adminId) {
            return res.status(403).json({ success: false, message: 'You cannot delete your own account' });
        }

        const admin = await User.findByIdAndDelete(adminId);
        if (!admin) {
            return res.status(404).json({ success: false, message: 'Admin not found' });
        }

        res.json({ success: true, message: 'Admin deleted successfully' });
    } catch (error) {
        console.error('Delete admin error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router;
