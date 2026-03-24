const express = require('express');
const router = express.Router();
const SocialMedia = require('../models/SocialMedia');

// Get social media links
router.get('/', async (req, res) => {
    try {
        let socialMedia = await SocialMedia.findOne();
        if (!socialMedia) {
            // Return empty defaults if not found
            return res.json({
                success: true,
                data: {
                    facebook: "",
                    instagram: "",
                    twitter: "",
                    linkedin: "",
                    youtube: "",
                    whatsappNumber: "",
                    whatsappMessage: "",
                    callNumber: ""
                }
            });
        }
        res.json({ success: true, data: socialMedia });
    } catch (error) {
        console.error('Error fetching social media:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Update social media links
router.put('/', async (req, res) => {
    try {
        const updateData = req.body;
        const socialMedia = await SocialMedia.findOneAndUpdate(
            {}, // Empty filter to match the only record
            updateData,
            { new: true, upsert: true, setDefaultsOnInsert: true }
        );
        res.json({ success: true, message: 'Social media updated successfully', data: socialMedia });
    } catch (error) {
        console.error('Error updating social media:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router;
