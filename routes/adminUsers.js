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
