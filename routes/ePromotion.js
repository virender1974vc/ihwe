const express = require('express');
const router = express.Router();
const EPromotionContent = require('../models/EPromotionContent');
const EPromotionEnquiry = require('../models/EPromotionEnquiry');

// --- Content Routes ---

// Get content
router.get('/content', async (req, res) => {
    try {
        let content = await EPromotionContent.findOne();
        if (!content) {
            // Create default content if not exists
            content = new EPromotionContent({
                cards: [
                    { icon: 'MessageCircle', title: 'WhatsApp Campaigns', description: 'Targeted WhatsApp marketing to our registered visitors & groups.', color: '#25D366' },
                    { icon: 'Mail', title: 'Email Blasts', description: 'Promote your brand via our curated mailing lists of 100k+.', color: '#1a73e8' },
                    { icon: 'Share2', title: 'Social Media Shoutouts', description: 'Brand features on our Instagram, Facebook & YouTube handles.', color: '#d26019' }
                ]
            });
            await content.save();
        }
        res.json({ success: true, data: content });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Update content
router.post('/content', async (req, res) => {
    try {
        let content = await EPromotionContent.findOne();
        if (content) {
            Object.assign(content, req.body);
            content.updatedAt = Date.now();
            await content.save();
        } else {
            content = new EPromotionContent(req.body);
            await content.save();
        }
        res.json({ success: true, message: 'Content updated successfully', data: content });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// --- Enquiry Routes ---

// Submit enquiry (Frontend)
router.post('/enquiry', async (req, res) => {
    try {
        const enquiry = new EPromotionEnquiry(req.body);
        await enquiry.save();
        res.status(201).json({ success: true, message: 'Enquiry submitted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Get all enquiries (Admin)
router.get('/enquiries', async (req, res) => {
    try {
        const enquiries = await EPromotionEnquiry.find().sort({ createdAt: -1 });
        res.json({ success: true, data: enquiries });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Delete enquiry (Admin)
router.delete('/enquiries/:id', async (req, res) => {
    try {
        await EPromotionEnquiry.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: 'Enquiry deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
