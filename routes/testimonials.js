const express = require('express');
const router = express.Router();
const Testimonial = require('../models/Testimonial');

// Helper to get or create the singleton document
const getTestimonials = async () => {
    let data = await Testimonial.findOne();
    if (!data) {
        data = new Testimonial({
            subheading: 'Testimonials',
            heading: 'What Global Leaders Are Saying',
            highlightText: 'Are Saying',
            description: 'Voices of trust from healthcare innovators, clinical experts, and industry pioneers across the globe.',
            cards: []
        });
        await data.save();
    }
    return data;
};

// GET all testimonials data
router.get('/', async (req, res) => {
    try {
        const data = await getTestimonials();
        res.json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// POST update headings
router.post('/headings', async (req, res) => {
    try {
        const { subheading, heading, highlightText, description } = req.body;
        const data = await getTestimonials();
        
        data.subheading = subheading || data.subheading;
        data.heading = heading || data.heading;
        data.highlightText = highlightText || data.highlightText;
        data.description = description || data.description;
        
        await data.save();
        res.json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// POST add new card
router.post('/cards', async (req, res) => {
    try {
        const { name, role, company, feedback, rating } = req.body;
        const data = await getTestimonials();
        
        // Generate initials
        const nameParts = name.trim().split(' ');
        let initials = '';
        if (nameParts.length > 0) {
            initials = nameParts[0][0].toUpperCase();
            if (nameParts.length > 1) {
                initials += nameParts[nameParts.length - 1][0].toUpperCase();
            }
        }

        data.cards.push({ name, role, company, initials, feedback, rating });
        await data.save();
        res.status(201).json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// PUT update card
router.put('/cards/:id', async (req, res) => {
    try {
        const { name, role, company, feedback, rating } = req.body;
        const data = await getTestimonials();
        
        const card = data.cards.id(req.params.id);
        if (!card) return res.status(404).json({ success: false, message: 'Card not found' });
        
        card.name = name || card.name;
        card.role = role || card.role;
        card.company = company || card.company;
        card.feedback = feedback || card.feedback;
        card.rating = rating || card.rating;
        
        // Update initials if name changed
        if (name) {
            const nameParts = name.trim().split(' ');
            let initials = '';
            if (nameParts.length > 0) {
                initials = nameParts[0][0].toUpperCase();
                if (nameParts.length > 1) {
                    initials += nameParts[nameParts.length - 1][0].toUpperCase();
                }
            }
            card.initials = initials;
        }
        
        await data.save();
        res.json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// DELETE card
router.delete('/cards/:id', async (req, res) => {
    try {
        const data = await getTestimonials();
        data.cards.pull({ _id: req.params.id });
        await data.save();
        res.json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
