const express = require('express');
const router = express.Router();
const Introduction = require('../models/Introduction');
const multer = require('multer');
const path = require('path');

// Multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage });

// GET Introduction data (Seeds if not exists)
router.get('/', async (req, res) => {
  try {
    let data = await Introduction.findOne();
    if (!data) {
      data = new Introduction({
        subtitle: 'INTRODUCTION',
        title: 'A Global Platform for Health, Wellness & Integrated Healthcare',
        description: 'International Health & Wellness Expo 2026 stands as India\'s most influential international platform dedicated to healthcare excellence, wellness innovation, and sustainable living...',
        bgColor: '#ffffff',
        features: [
          { icon: 'Award', number: '10+', label: 'YEARS OF LEGACY', order: 1 },
          { icon: 'Sparkles', number: '8', label: 'SUCCESSFUL EDITIONS', order: 2 },
          { icon: 'Users', number: '10,000+', label: 'EXHIBITORS & BRANDS', order: 3 },
          { icon: 'Globe', number: '80+', label: 'COUNTRIES PARTICIPATED', order: 4 }
        ]
      });
      await data.save();
    }
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update Settings & Image
router.post('/settings', upload.single('image'), async (req, res) => {
  try {
    const { subtitle, title, description, altText, bgColor } = req.body;
    let data = await Introduction.findOne();
    if (!data) data = new Introduction();

    data.subtitle = subtitle || data.subtitle;
    data.title = title || data.title;
    data.description = description || data.description;
    data.altText = altText || data.altText;
    data.bgColor = bgColor || data.bgColor;
    
    if (req.file) {
      data.image = `/uploads/${req.file.filename}`;
    }
    
    await data.save();
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Add Feature
router.post('/features', async (req, res) => {
  try {
    const { icon, number, label, order } = req.body;
    const data = await Introduction.findOne();
    if (!data) return res.status(404).json({ success: false, message: 'Settings not found' });

    data.features.push({ icon, number, label, order, updatedBy: req.user?.name || 'Admin' });
    await data.save();
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update Feature
router.put('/features/:id', async (req, res) => {
  try {
    const { icon, number, label, order } = req.body;
    const data = await Introduction.findOne();
    if (!data) return res.status(404).json({ success: false, message: 'Settings not found' });

    const feature = data.features.id(req.params.id);
    if (!feature) return res.status(404).json({ success: false, message: 'Feature not found' });

    feature.icon = icon;
    feature.number = number;
    feature.label = label;
    feature.order = order;
    feature.updatedAt = Date.now();
    feature.updatedBy = req.user?.name || 'Admin';

    await data.save();
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Delete Feature
router.delete('/features/:id', async (req, res) => {
  try {
    const data = await Introduction.findOne();
    if (!data) return res.status(404).json({ success: false, message: 'Settings not found' });

    data.features.pull(req.params.id);
    await data.save();
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
