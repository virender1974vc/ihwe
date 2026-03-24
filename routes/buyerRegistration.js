const express = require('express');
const router = express.Router();
const BuyerRegistration = require('../models/BuyerRegistration');

// @route   POST /api/buyer-registration
// @desc    Submit a buyer registration
// @access  Public
router.post('/', async (req, res) => {
    try {
        const registrationData = req.body;
        
        // Basic validation
        const requiredFields = ['companyName', 'country', 'contactPerson', 'designation', 'email', 'whatsapp', 'preferredMeetingType'];
        for (const field of requiredFields) {
            if (!registrationData[field]) {
                return res.status(400).json({ success: false, message: `${field} is required` });
            }
        }

        const newRegistration = new BuyerRegistration(registrationData);
        await newRegistration.save();

        res.status(201).json({ success: true, message: 'Registration submitted successfully', data: newRegistration });
    } catch (err) {
        console.error('Error submitting buyer registration:', err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

// @route   GET /api/buyer-registration
// @desc    Get all buyer registrations
// @access  Public (Should be protected)
router.get('/', async (req, res) => {
    try {
        const registrations = await BuyerRegistration.find().sort({ createdAt: -1 });
        res.json({ success: true, data: registrations });
    } catch (err) {
        console.error('Error fetching buyer registrations:', err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

// @route   GET /api/buyer-registration/:id
// @desc    Get a single buyer registration
// @access  Public (Should be protected)
router.get('/:id', async (req, res) => {
    try {
        const registration = await BuyerRegistration.findById(req.params.id);
        if (!registration) {
            return res.status(404).json({ success: false, message: 'Registration not found' });
        }
        res.json({ success: true, data: registration });
    } catch (err) {
        console.error('Error fetching buyer registration:', err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

// @route   PUT /api/buyer-registration/:id
// @desc    Update a buyer registration
// @access  Public (Should be protected)
router.put('/:id', async (req, res) => {
    try {
        const updatedRegistration = await BuyerRegistration.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        if (!updatedRegistration) {
            return res.status(404).json({ success: false, message: 'Registration not found' });
        }

        res.json({ success: true, message: 'Registration updated successfully', data: updatedRegistration });
    } catch (err) {
        console.error('Error updating buyer registration:', err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

// @route   DELETE /api/buyer-registration/:id
// @desc    Delete a buyer registration
// @access  Public (Should be protected)
router.delete('/:id', async (req, res) => {
    try {
        const registration = await BuyerRegistration.findById(req.params.id);
        if (!registration) {
            return res.status(404).json({ success: false, message: 'Registration not found' });
        }

        await registration.deleteOne();
        res.json({ success: true, message: 'Registration removed' });
    } catch (err) {
        console.error('Error deleting buyer registration:', err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

module.exports = router;
