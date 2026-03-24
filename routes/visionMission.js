const express = require('express');
const router = express.Router();
const VisionMission = require('../models/VisionMission');
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

// Get Vision & Mission content
router.get('/', async (req, res) => {
    try {
        let content = await VisionMission.findOne();
        if (!content) {
            content = await VisionMission.create({
                mission: {
                    title: 'Our Mission',
                    icon: 'Target',
                    description: '"To create awareness about preventive healthcare, encourage the adoption of holistic wellness practices, and connect stakeholders from AYUSH, modern medicine, nutrition, and wellness technologies."',
                    highlightText: 'AYUSH'
                },
                vision: {
                    title: 'Our Vision',
                    icon: 'Milestone',
                    description: '"To empower every individual with the knowledge of preventive healthcare and the tools for a sustainable, healthy future — bridging traditional wisdom with modern innovation globally."',
                    highlightText: 'sustainable, healthy future'
                },
                backgroundColor: '#23471d'
            });
        }
        res.json({ success: true, data: content });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Update Vision & Mission content
router.post('/update', verifyToken, async (req, res) => {
    try {
        const updatedContent = await VisionMission.findOneAndUpdate(
            {},
            { ...req.body, lastUpdated: Date.now() },
            { new: true, upsert: true }
        );
        res.json({ success: true, data: updatedContent });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
