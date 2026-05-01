const express = require('express');
const router = express.Router();
const NationalExpo = require('../models/NationalExpo');
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage });

// GET National Expo data
router.get('/', async (req, res) => {
  try {
    let data = await NationalExpo.findOne();
    if (!data) {
      data = new NationalExpo({
        subtitle: 'From India to the World',
        title: 'From a National Expo to a Global Platform',
        description: 'The 9th Edition – Global Edition marks a strategic evolution of IHWE, designed to attract:',
        points: [
          { text: "International Exhibitors & Global Brands", order: 1 },
          { text: "Buyers, Distributors & Importers", order: 2 },
          { text: "Hospitals & Healthcare Institutions", order: 3 },
          { text: "Investors, Startups & Innovators", order: 4 },
          { text: "Government Bodies, Embassies & Policymakers", order: 5 }
        ],
        cards: [
          { icon: 'Globe', goldTitle: 'GLOBAL', whiteTitle: 'EXHIBITORS', description: 'Showcase to a global audience', order: 1 },
          { icon: 'UserCheck', goldTitle: 'INTERNATIONAL', whiteTitle: 'BUYERS', description: 'Connect with decision makers', order: 2 },
          { icon: 'BookOpen', goldTitle: 'POLICY &', whiteTitle: 'KNOWLEDGE', description: 'Dialogue, insights & roadmaps', order: 3 },
          { icon: 'TrendingUp', goldTitle: 'INVESTMENT &', whiteTitle: 'INNOVATION', description: 'Growth & collaboration', order: 4 }
        ]
      });
      await data.save();
    }
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update Settings & BG Image
router.post('/settings', upload.single('bgImage'), async (req, res) => {
  try {
    const { subtitle, title, description, altText } = req.body;
    let data = await NationalExpo.findOne();
    if (!data) data = new NationalExpo();

    data.subtitle = subtitle || data.subtitle;
    data.title = title || data.title;
    data.description = description || data.description;
    data.altText = altText || data.altText;
    
    if (req.file) {
      data.bgImage = `/uploads/${req.file.filename}`;
    }
    
    await data.save();
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Points Management
router.post('/points', async (req, res) => {
  try {
    const data = await NationalExpo.findOne();
    data.points.push(req.body);
    await data.save();
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/points/:id', async (req, res) => {
  try {
    const data = await NationalExpo.findOne();
    const point = data.points.id(req.params.id);
    point.text = req.body.text;
    point.order = req.body.order;
    await data.save();
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.delete('/points/:id', async (req, res) => {
  try {
    const data = await NationalExpo.findOne();
    data.points.pull(req.params.id);
    await data.save();
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Cards Management
router.post('/cards', async (req, res) => {
  try {
    const data = await NationalExpo.findOne();
    data.cards.push(req.body);
    await data.save();
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/cards/:id', async (req, res) => {
  try {
    const data = await NationalExpo.findOne();
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
    const data = await NationalExpo.findOne();
    data.cards.pull(req.params.id);
    await data.save();
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
