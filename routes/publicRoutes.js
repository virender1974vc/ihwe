const express = require('express');
const router = express.Router();
const User = require('../models/User');
router.get('/employees', async (req, res) => {
    try {
        const employees = await User.find({ role: { $ne: 'exhibitor' }, status: 'Active' })
            .select('username fullName designation email mobile altMobile role')
            .sort({ username: 1 });
        res.json({ success: true, data: employees });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});
router.get('/staff', async (req, res) => {
    try {
        const users = await User.find({ status: 'Active' })
            .select('username fullName designation email mobile altMobile role')
            .sort({ username: 1 });
        res.json({ success: true, data: users });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router;

