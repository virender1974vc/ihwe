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

// Configure Cloudinary storage for admin user image uploads (HOD photo, profile photo,
// signature) — folder is picked per-field so one multer instance can handle all three.
const FOLDER_BY_FIELD = {
    hodImage: 'hod-passport-photos',
    profileImage: 'admin-profile-photos',
    signatureImage: 'user-signatures',
};
const adminImageStorage = new CloudinaryStorage({
    cloudinary,
    params: (req, file) => ({
        folder: FOLDER_BY_FIELD[file.fieldname] || 'admin-uploads',
        allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    }),
});

const upload = multer({ storage: adminImageStorage });

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
        const query = (req.params.username || '').trim();
        let user = await User.findOne({ username: query })
            .select('username fullName department designation email mobile altMobile role hodImage profileImage hodName hodMobile hodEmail hodDesignation reportingToName reportingToMobile reportingToEmail reportingToDesignation reportingToImage');
        if (!user) {
            user = await User.findOne({ username: { $regex: new RegExp(`^${query}`, 'i') } })
                .select('username fullName department designation email mobile altMobile role hodImage profileImage hodName hodMobile hodEmail hodDesignation reportingToName reportingToMobile reportingToEmail reportingToDesignation reportingToImage');
        }
        if (!user) {
            user = await User.findOne({ fullName: { $regex: new RegExp(query, 'i') } })
                .select('username fullName department designation email mobile altMobile role hodImage profileImage hodName hodMobile hodEmail hodDesignation reportingToName reportingToMobile reportingToEmail reportingToDesignation reportingToImage');
        }
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });
        res.json({ success: true, data: user });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// @route   GET /api/admin/performance/:id
// @desc    Get person-specific lead and exhibitor-booking performance
router.get('/performance/:id', verifyToken, async (req, res) => {
    try {
        const User = require('../models/User');
        const Role = require('../models/Role');
        const Company = require('../models/Company');
        const ExhibitorRegistration = require('../models/ExhibitorRegistration');
        const user = await User.findById(req.params.id).select('username fullName role').lean();
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        const roleSlug = String(req.user?.role || '').toLowerCase().replace(/[^a-z]/g, '');
        const isSuperAdmin = roleSlug === 'superadmin' || roleSlug === 'ihwesuperadministrator';
        const requesterRole = isSuperAdmin ? null : await Role.findOne({ name: req.user?.role }).select('permissions').lean();
        const canManageUsers = isSuperAdmin || requesterRole?.permissions?.['User ID Management'] === true;
        if (!canManageUsers && String(req.user?.id) !== String(user._id)) {
            return res.status(403).json({ success: false, message: 'Unauthorized to view this performance' });
        }

        const names = [user.username, user.fullName].filter(Boolean);
        const exactNameMatchers = names.map(name => ({
            $regex: new RegExp(`^${String(name).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i')
        }));
        const start = new Date(new Date().getFullYear(), 0, 1);
        const end = new Date(new Date().getFullYear() + 1, 0, 1);
        const attribution = [];
        exactNameMatchers.forEach(matcher => {
            attribution.push({ forwardTo: matcher }, { assignedTo: matcher }, { spokenWith: matcher }, { added_by: matcher });
        });

        const totalLeads = await Company.countDocuments({
            companyStatus: { $regex: /^New Lead$/i },
            createdAt: { $gte: start, $lt: end },
            $or: attribution
        });
        const bookingAttribution = exactNameMatchers.map(matcher => ({ spokenWith: matcher }));
        const stallBookings = await ExhibitorRegistration.countDocuments({
            createdAt: { $gte: start, $lt: end },
            $or: bookingAttribution
        });
        const amountResult = await ExhibitorRegistration.aggregate([
            {
                $match: {
                    createdAt: { $gte: start, $lt: end },
                    $or: bookingAttribution
                }
            },
            { $group: { _id: null, total: { $sum: { $ifNull: ['$amountPaid', 0] } } } }
        ]);
        const totalAmountAchieved = Number(amountResult[0]?.total || 0);
        const conversionRate = totalLeads > 0 ? Number(((stallBookings / totalLeads) * 100).toFixed(2)) : 0;

        res.json({
            success: true,
            data: { totalLeads, stallBookings, conversionRate, totalAmountAchieved, period: 'this_year' }
        });
    } catch (error) {
        console.error('Fetch admin performance error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch user performance' });
    }
});
router.get('/:id', verifyToken, (req, res) => adminUsersController.getAdminById(req, res));

// @route   POST /api/admin/create
// @desc    Create a new admin user
router.post('/create', verifyToken, upload.fields([{ name: 'hodImage', maxCount: 1 }, { name: 'profileImage', maxCount: 1 }, { name: 'signatureImage', maxCount: 1 }]), (req, res) => adminUsersController.createAdmin(req, res));

// @route   PUT /api/admin/update/:id
// @desc    Update an admin user
router.put('/update/:id', verifyToken, upload.fields([{ name: 'hodImage', maxCount: 1 }, { name: 'profileImage', maxCount: 1 }, { name: 'signatureImage', maxCount: 1 }]), (req, res) => adminUsersController.updateAdmin(req, res));

// @route   DELETE /api/admin/delete/:id
// @desc    Delete an admin user
router.delete('/delete/:id', verifyToken, (req, res) => adminUsersController.deleteAdmin(req, res));

module.exports = router;
