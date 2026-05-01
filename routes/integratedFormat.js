const express = require('express');
const router = express.Router();
const IntegratedFormat = require('../models/IntegratedFormat');

// GET Integrated Format data
router.get('/', async (req, res) => {
  try {
    let data = await IntegratedFormat.findOne();
    if (!data) {
      data = new IntegratedFormat({
        subtitle: 'OUR COMPREHENSIVE',
        title: 'INTEGRATED FORMAT',
        description: 'The 9th International Health & Wellness Expo brings together innovation, business, and global opportunities on one powerful platform. Designed to maximize engagement and meaningful connections, it creates a dynamic space for exhibitors, buyers, and healthcare leaders.\n\nFrom exhibitions and conferences to awards and buyer-seller meets, every element is curated to promote knowledge exchange, inspire innovation, and recognize excellence in the health and wellness industry.',
        leafColor: '#23471d',
        cards: [
          { icon: 'Building2', title: 'DYNAMIC EXHIBITION', description: 'Showcasing cutting-edge innovations, products, and services from global leaders and emerging startups...', cardNumber: '01', order: 1 },
          { icon: 'Users', title: 'INSIGHTFUL CONFERENCE & AROGYA SANGOSHTHI', description: 'A platform for critical policy dialogue, knowledge dissemination, and expert discussions...', cardNumber: '02', order: 2 },
          { icon: 'Award', title: 'PRESTIGIOUS AWARDS CEREMONY', description: 'Recognizing excellence and innovation across the health and wellness spectrum...', cardNumber: '03', order: 3 },
          { icon: 'Handshake', title: 'EXCLUSIVE BUYER-SELLER MEETS', description: 'Facilitating strategically curated B2B interactions and fostering powerful partnerships...', cardNumber: '04', order: 4 }
        ],
        highlights: [
          { icon: 'Globe', title: 'GLOBAL PARTICIPATION', description: 'Connect with leaders and innovators from around the world.', order: 1 },
          { icon: 'Users', title: 'MEANINGFUL CONNECTIONS', description: 'Build valuable relationships that drive growth.', order: 2 },
          { icon: 'Activity', title: 'HEALTHIER COMMUNITIES', description: 'Empowering people to live healthier & happier lives.', order: 3 },
          { icon: 'Leaf', title: 'SUSTAINABLE FUTURE', description: 'Creating a better tomorrow through innovation & collaboration.', order: 4 }
        ]
      });
      await data.save();
    }
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update Settings
router.post('/settings', async (req, res) => {
  try {
    const { subtitle, title, description, leafColor } = req.body;
    let data = await IntegratedFormat.findOne();
    if (!data) data = new IntegratedFormat();

    data.subtitle = subtitle || data.subtitle;
    data.title = title || data.title;
    data.description = description || data.description;
    data.leafColor = leafColor || data.leafColor;
    
    await data.save();
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Cards Management
router.post('/cards', async (req, res) => {
  try {
    const data = await IntegratedFormat.findOne();
    data.cards.push(req.body);
    await data.save();
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/cards/:id', async (req, res) => {
  try {
    const data = await IntegratedFormat.findOne();
    const card = data.cards.id(req.params.id);
    Object.assign(card, req.body);
    await data.save();
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.delete('/cards/:id', async (req, res) => {
  try {
    const data = await IntegratedFormat.findOne();
    data.cards.pull(req.params.id);
    await data.save();
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Highlights Management
router.post('/highlights', async (req, res) => {
  try {
    const data = await IntegratedFormat.findOne();
    data.highlights.push(req.body);
    await data.save();
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/highlights/:id', async (req, res) => {
  try {
    const data = await IntegratedFormat.findOne();
    const highlight = data.highlights.id(req.params.id);
    Object.assign(highlight, req.body);
    await data.save();
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.delete('/highlights/:id', async (req, res) => {
  try {
    const data = await IntegratedFormat.findOne();
    data.highlights.pull(req.params.id);
    await data.save();
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
