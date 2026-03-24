const express = require('express');
const router = express.Router();
const StallVendor = require('../models/StallVendor');

// Get all content
router.get('/', async (req, res) => {
    try {
        let content = await StallVendor.findOne();
        if (!content) {
            content = await StallVendor.create({});
        }
        res.json({ success: true, data: content });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Update headings
router.get('/headings', async (req, res) => {
    try {
        let content = await StallVendor.findOne();
        if (!content) {
            content = await StallVendor.create({});
        }
        res.json({ success: true, data: {
            subheading: content.subheading,
            heading: content.heading,
            highlightText: content.highlightText,
            description: content.description
        }});
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

router.post('/headings', async (req, res) => {
    try {
        const { subheading, heading, highlightText, description } = req.body;
        let content = await StallVendor.findOne();
        if (!content) {
            content = new StallVendor();
        }
        content.subheading = subheading;
        content.heading = heading;
        content.highlightText = highlightText;
        content.description = description;
        content.updatedAt = Date.now();
        await content.save();
        res.json({ success: true, data: content });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Add card
router.post('/cards', async (req, res) => {
    try {
        const cardData = req.body;
        let content = await StallVendor.findOne();
        if (!content) {
            content = new StallVendor();
        }
        content.cards.push(cardData);
        content.updatedAt = Date.now();
        await content.save();
        res.json({ success: true, data: content.cards[content.cards.length - 1] });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Update card
router.put('/cards/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;
        const content = await StallVendor.findOne();
        if (!content) return res.status(404).json({ success: false, message: 'Content not found' });
        
        const cardIndex = content.cards.findIndex(c => c._id.toString() === id);
        if (cardIndex === -1) return res.status(404).json({ success: false, message: 'Card not found' });
        
        content.cards[cardIndex] = { ...content.cards[cardIndex].toObject(), ...updateData };
        content.updatedAt = Date.now();
        await content.save();
        res.json({ success: true, data: content.cards[cardIndex] });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Delete card
router.delete('/cards/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const content = await StallVendor.findOne();
        if (!content) return res.status(404).json({ success: false, message: 'Content not found' });
        
        content.cards = content.cards.filter(c => c._id.toString() !== id);
        content.updatedAt = Date.now();
        await content.save();
        res.json({ success: true, message: 'Card deleted' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
