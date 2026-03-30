const express = require('express');
const router = express.Router();
const User = require('../models/User');

// @route   GET /api/public/employees
// @desc    Get list of employees for referral
router.get('/employees', async (req, res) => {
    try {
        const employees = await User.find({ role: { $ne: 'exhibitor' }, status: 'Active' })
            .select('username role')
            .sort({ username: 1 });
        res.json({ success: true, data: employees });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// @route   GET /api/public/staff
// @desc    Get all staff/admin users for dropdown
router.get('/staff', async (req, res) => {
    try {
        const users = await User.find({ status: 'Active' })
            .select('username role')
            .sort({ username: 1 });
        res.json({ success: true, data: users });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router;
