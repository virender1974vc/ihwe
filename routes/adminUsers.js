const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const adminUsersController = require('../controllers/adminUsersController');
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('cloudinary').v2;

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Configure Cloudinary storage for HOD image upload
const hodStorage = new CloudinaryStorage({
    cloudinary,
    params: {
        folder: 'hod-passport-photos',
        allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    },
});

const upload = multer({ storage: hodStorage });

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

// @route   POST /api/admin/verify-email
// @desc    Verify if official email already exists
router.post('/verify-email', async (req, res) => {
    try {
        const { email, id } = req.body;
        if (!email) return res.status(400).json({ success: false, message: 'Email is required' });

        const User = require('../models/User');
        const query = { email: email.trim() };
        if (id) query._id = { $ne: id };

        const existing = await User.findOne(query);
        if (existing) {
            return res.status(400).json({ success: false, message: 'Official Email already exists' });
        }
        res.json({ success: true, message: 'Email is available' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// @route   POST /api/admin/verify-mobile
// @desc    Verify if official mobile already exists
router.post('/verify-mobile', async (req, res) => {
    try {
        const { mobile, id } = req.body;
        if (!mobile) return res.status(400).json({ success: false, message: 'Mobile number is required' });

        const User = require('../models/User');
        const query = { mobile: mobile.trim() };
        if (id) query._id = { $ne: id };

        const existing = await User.findOne(query);
        if (existing) {
            return res.status(400).json({ success: false, message: 'Official Mobile Number already registered' });
        }
        res.json({ success: true, message: 'Mobile number is available' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// @route   GET /api/admin/public-list
// @desc    Get minimal public list of active admin users (for dropdowns)
router.get('/public-list', async (req, res) => {
    try {
        const User = require('../models/User');
        const users = await User.find({ status: 'Active' })
            .select('username fullName designation email mobile altMobile role hodImage profileImage')
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
        const query = req.params.username;
        const user = await User.findOne({ username: query })
            .select('username fullName designation email mobile altMobile role hodImage profileImage hodName hodMobile hodEmail hodDesignation reportingToName reportingToMobile reportingToEmail reportingToDesignation reportingToImage');
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });
        res.json({ success: true, data: user });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// @route   POST /api/admin/create
// @desc    Create a new admin user
router.post('/create', verifyToken, upload.fields([{ name: 'hodImage', maxCount: 1 }, { name: 'profileImage', maxCount: 1 }]), (req, res) => adminUsersController.createAdmin(req, res));

// @route   PUT /api/admin/update/:id
// @desc    Update an admin user
router.put('/update/:id', verifyToken, upload.fields([{ name: 'hodImage', maxCount: 1 }, { name: 'profileImage', maxCount: 1 }]), (req, res) => adminUsersController.updateAdmin(req, res));

// @route   DELETE /api/admin/delete/:id
// @desc    Delete an admin user
router.delete('/delete/:id', verifyToken, (req, res) => adminUsersController.deleteAdmin(req, res));

module.exports = router;
