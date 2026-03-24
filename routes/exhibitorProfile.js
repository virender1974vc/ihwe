const express = require('express');
const router = express.Router();
const ExhibitorProfile = require('../models/ExhibitorProfile');

// GET all exhibitor profile data
router.get('/', async (req, res) => {
    try {
        let profile = await ExhibitorProfile.findOne();
        if (!profile) {
            // Create default profile if it doesn't exist
            profile = new ExhibitorProfile();
            await profile.save();
        }
        res.json(profile);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// UPDATE headings and show info
router.put('/meta', async (req, res) => {
    try {
        const { subheading, heading, eventDate, eventDay, venueHall, venueCity } = req.body;
        const profile = await ExhibitorProfile.findOne();
        if (profile) {
            profile.subheading = subheading || profile.subheading;
            profile.heading = heading || profile.heading;
            profile.eventDate = eventDate || profile.eventDate;
            profile.eventDay = eventDay || profile.eventDay;
            profile.venueHall = venueHall || profile.venueHall;
            profile.venueCity = venueCity || profile.venueCity;
            await profile.save();
            res.json(profile);
        } else {
            res.status(404).json({ message: 'Profile not found' });
        }
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// ADD segment
router.post('/segments', async (req, res) => {
    try {
        const { title, accent } = req.body;
        console.log('Adding segment:', title, accent);
        const profile = await ExhibitorProfile.findOne() || new ExhibitorProfile();
        profile.segments.push({ title, accent });
        await profile.save();
        console.log('Segment added successfully');
        res.status(201).json(profile);
    } catch (error) {
        console.error('Error adding segment:', error);
        res.status(400).json({ message: error.message });
    }
});

// DELETE segment
router.delete('/segments/:id', async (req, res) => {
    try {
        const profile = await ExhibitorProfile.findOne();
        if (profile) {
            profile.segments = profile.segments.filter(s => s._id.toString() !== req.params.id);
            await profile.save();
            res.json(profile);
        } else {
            res.status(404).json({ message: 'Profile not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// ADD product category
router.post('/categories', async (req, res) => {
    try {
        const { title } = req.body;
        console.log('Adding category:', title);
        const profile = await ExhibitorProfile.findOne() || new ExhibitorProfile();
        profile.productCategories.push({ title });
        await profile.save();
        console.log('Category added successfully');
        res.status(201).json(profile);
    } catch (error) {
        console.error('Error adding category:', error);
        res.status(400).json({ message: error.message });
    }
});

// DELETE product category
router.delete('/categories/:id', async (req, res) => {
    try {
        const profile = await ExhibitorProfile.findOne();
        if (profile) {
            profile.productCategories = profile.productCategories.filter(c => c._id.toString() !== req.params.id);
            await profile.save();
            res.json(profile);
        } else {
            res.status(404).json({ message: 'Profile not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// UPDATE segment
router.put('/segments/:id', async (req, res) => {
    try {
        const { title, accent } = req.body;
        const profile = await ExhibitorProfile.findOne();
        if (profile) {
            const segment = profile.segments.id(req.params.id);
            if (segment) {
                segment.title = title || segment.title;
                segment.accent = accent || segment.accent;
                await profile.save();
                res.json(profile);
            } else {
                res.status(404).json({ message: 'Segment not found' });
            }
        } else {
            res.status(404).json({ message: 'Profile not found' });
        }
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// UPDATE product category
router.put('/categories/:id', async (req, res) => {
    try {
        const { title } = req.body;
        const profile = await ExhibitorProfile.findOne();
        if (profile) {
            const category = profile.productCategories.id(req.params.id);
            if (category) {
                category.title = title || category.title;
                await profile.save();
                res.json(profile);
            } else {
                res.status(404).json({ message: 'Category not found' });
            }
        } else {
            res.status(404).json({ message: 'Profile not found' });
        }
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

module.exports = router;
