const express = require('express');
const router = express.Router();
const ContactEnquiry = require('../models/ContactEnquiry');

// @route   POST /api/contact-enquiry
// @desc    Submit a contact enquiry
// @access  Public
router.post('/', async (req, res) => {
    try {
        const { name, email, phone, service, message } = req.body;

        if (!name || !email || !phone || !service || !message) {
            return res.status(400).json({ success: false, message: 'All fields are required' });
        }

        const newEnquiry = new ContactEnquiry({
            name,
            email,
            phone,
            service,
            message
        });

        await newEnquiry.save();

        res.status(201).json({ success: true, message: 'Enquiry submitted successfully', data: newEnquiry });
    } catch (err) {
        console.error('Error submitting enquiry:', err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

// @route   GET /api/contact-enquiry
// @desc    Get all contact enquiries
// @access  Public (Should be protected in production)
router.get('/', async (req, res) => {
    try {
        const enquiries = await ContactEnquiry.find().sort({ createdAt: -1 });
        res.json({ success: true, data: enquiries });
    } catch (err) {
        console.error('Error fetching enquiries:', err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

// @route   DELETE /api/contact-enquiry/:id
// @desc    Delete a contact enquiry
// @access  Public (Should be protected in production)
router.delete('/:id', async (req, res) => {
    try {
        const enquiry = await ContactEnquiry.findById(req.params.id);
        if (!enquiry) {
            return res.status(404).json({ success: false, message: 'Enquiry not found' });
        }

        await enquiry.deleteOne();
        res.json({ success: true, message: 'Enquiry removed' });
    } catch (err) {
        console.error('Error deleting enquiry:', err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

module.exports = router;
