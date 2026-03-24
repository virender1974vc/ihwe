const express = require('express');
const router = express.Router();
const WhyAttend = require('../models/WhyAttend');
const jwt = require('jsonwebtoken');

// Middleware to verify admin token
const verifyToken = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ success: false, message: 'Unauthorized' });
    
    const token = authHeader.split(' ')[1];
    jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret', (err, user) => {
        if (err) return res.status(403).json({ success: false, message: 'Token is invalid' });
        req.user = user;
        next();
    });
};

// Get Why Attend content
router.get('/', async (req, res) => {
    try {
        let content = await WhyAttend.findOne();
        if (!content) {
            content = await WhyAttend.create({
                subheading: 'Why Attend?',
                heading: 'Expo Highlights',
                highlightText: 'Highlights',
                cards: [
                    { title: '200+ Exhibitors', icon: 'Globe', desc: 'Across Health & Wellness sectors' },
                    { title: 'Yoga & Meditation', icon: 'Sun', desc: 'Live sessions and demonstrations' },
                    { title: 'Seminars', icon: 'BookOpen', desc: 'Expert-led panel discussions' },
                    { title: 'Checkup Camps', icon: 'Stethoscope', desc: 'Free health screening zones' },
                    { title: 'Networking', icon: 'Users', desc: 'Premium B2B meeting spaces' },
                    { title: 'Product Launches', icon: 'Zap', desc: 'New healthcare innovations' }
                ]
            });
        }
        res.json({ success: true, data: content });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Update headings
router.post('/headings', verifyToken, async (req, res) => {
    try {
        const { subheading, heading, highlightText } = req.body;
        const updated = await WhyAttend.findOneAndUpdate(
            {},
            { subheading, heading, highlightText, lastUpdated: Date.now() },
            { new: true, upsert: true }
        );
        res.json({ success: true, data: updated });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Add card
router.post('/cards', verifyToken, async (req, res) => {
    try {
        const { title, icon, desc } = req.body;
        const updated = await WhyAttend.findOneAndUpdate(
            {},
            { $push: { cards: { title, icon, desc } }, lastUpdated: Date.now() },
            { new: true, upsert: true }
        );
        res.json({ success: true, data: updated });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Update card
router.put('/cards/:id', verifyToken, async (req, res) => {
    try {
        const { title, icon, desc } = req.body;
        const updated = await WhyAttend.findOneAndUpdate(
            { 'cards._id': req.params.id },
            { 
                $set: { 
                    'cards.$.title': title,
                    'cards.$.icon': icon,
                    'cards.$.desc': desc
                },
                lastUpdated: Date.now()
            },
            { new: true }
        );
        res.json({ success: true, data: updated });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Delete card
router.delete('/cards/:id', verifyToken, async (req, res) => {
    try {
        const updated = await WhyAttend.findOneAndUpdate(
            {},
            { $pull: { cards: { _id: req.params.id } }, lastUpdated: Date.now() },
            { new: true }
        );
        res.json({ success: true, data: updated });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
