const express = require('express');
const router = express.Router();
const ExhibitorActivityLog = require('../models/ExhibitorActivityLog');

// Create a new activity log
router.post('/', async (req, res) => {
    try {
        const { companyName, exhibitorId, action, details, module, status } = req.body;
        
        if (!companyName || !action || !module) {
            return res.status(400).json({ success: false, message: 'Missing required fields' });
        }

        const newLog = new ExhibitorActivityLog({
            companyName,
            exhibitorId,
            action,
            details,
            module,
            status: status || 'Info'
        });

        await newLog.save();

        // Emit socket event if io is available
        const io = req.app.get('io');
        if (io) {
            io.emit('new_exhibitor_activity_log', newLog);
        }

        res.status(201).json({ success: true, data: newLog });
    } catch (error) {
        console.error('Error creating activity log:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

// Get activity logs (with optional pagination)
router.get('/', async (req, res) => {
    try {
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 50;
        const skip = (page - 1) * limit;

        const logs = await ExhibitorActivityLog.find()
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const total = await ExhibitorActivityLog.countDocuments();

        res.status(200).json({
            success: true,
            count: logs.length,
            total,
            totalPages: Math.ceil(total / limit),
            currentPage: page,
            data: logs
        });
    } catch (error) {
        console.error('Error fetching activity logs:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

module.exports = router;
