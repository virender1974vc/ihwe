const express = require('express');
const router = express.Router();
const Glimpse = require('../models/Glimpse');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const { logActivity } = require('../utils/logger');

// Middleware to verify JWT token
const verifyToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ success: false, message: 'No token provided' });
    try {
        req.user = jwt.verify(token, process.env.JWT_SECRET || 'ihwe_secret_2026');
        next();
    } catch (err) {
        return res.status(401).json({ success: false, message: 'Token expired or invalid' });
    }
};

// Storage for images
const storage = multer.diskStorage({

  destination: (req, file, cb) => {
    const dir = './uploads/glimpse';
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ storage: storage });

// Get all glimpse data
router.get('/', async (req, res) => {
  try {
    let glimpse = await Glimpse.findOne();
    if (!glimpse) {
      glimpse = new Glimpse({
        subheading: "Event Glimpses",
        heading: "BEST MOMENTS – IHWE 2026",
        highlightText: "BEST MOMENTS",
        description: "A glimpse into the energy, innovation, and success of IHWE 2026.",
        counterText: "Relive the moments that inspired connections and created impact",
        counters: [
          { icon: "Users", number: "10,000+", label: "Trade Visitors", order: 1 },
          { icon: "Globe", number: "30+", label: "Countries", order: 2 },
          { icon: "Building2", number: "250+", label: "Exhibitors", order: 3 },
          { icon: "Mic", number: "40+", label: "Expert Speakers", order: 4 },
          { icon: "Handshake", number: "B2B", label: "B2B Meetings", order: 5 },
          { icon: "Package", number: "500+", label: "Organic Products", order: 6 },
          { icon: "Sparkles", number: "Endless", label: "Opportunities", order: 7 }
        ]
      });
      await glimpse.save();
    }
    res.json({ success: true, data: glimpse });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update headings
router.post('/headings', verifyToken, async (req, res) => {
  try {
    const { subheading, heading, highlightText, description, counterText } = req.body;
    let glimpse = await Glimpse.findOne();
    if (!glimpse) {
      glimpse = new Glimpse({ subheading, heading, highlightText, description, counterText });
    } else {
      glimpse.subheading = subheading;
      glimpse.heading = heading;
      glimpse.highlightText = highlightText;
      glimpse.description = description;
      glimpse.counterText = counterText;
    }
    glimpse.updatedBy = req.user.username;
    await glimpse.save();
    await logActivity(req, 'Updated', 'Glimpse Management', 'Updated section headings');
    res.json({ success: true, data: glimpse });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});


// Add image card
router.post('/images', verifyToken, async (req, res) => {
  try {
    const { url, title, altText } = req.body;
    let glimpse = await Glimpse.findOne();
    if (!glimpse) {
      glimpse = new Glimpse();
    }
    glimpse.images.push({ url, title, altText, updatedBy: req.user.username, updatedAt: new Date() });
    glimpse.updatedBy = req.user.username;
    await glimpse.save();
    await logActivity(req, 'Created', 'Glimpse Management', `Added new glimpse image: ${title}`);
    res.json({ success: true, data: glimpse });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});


// Update image card
router.put('/images/:imageId', verifyToken, async (req, res) => {
  try {
    const { url, title, altText } = req.body;
    const { imageId } = req.params;
    let glimpse = await Glimpse.findOne();
    if (!glimpse) return res.status(404).json({ success: false, message: "Glimpse not found" });

    const image = glimpse.images.id(imageId);
    if (!image) return res.status(404).json({ success: false, message: "Image not found" });

    image.url = url;
    image.title = title;
    image.altText = altText;
    image.updatedBy = req.user.username;
    image.updatedAt = new Date();
    glimpse.updatedBy = req.user.username;

    await glimpse.save();
    await logActivity(req, 'Updated', 'Glimpse Management', `Updated glimpse image: ${title}`);
    res.json({ success: true, data: glimpse });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});


// Delete image card
router.delete('/images/:imageId', verifyToken, async (req, res) => {
  try {
    const { imageId } = req.params;
    let glimpse = await Glimpse.findOne();
    if (!glimpse) return res.status(404).json({ success: false, message: "Glimpse not found" });

    glimpse.images = glimpse.images.filter(img => img._id.toString() !== imageId);
    glimpse.updatedBy = req.user.username;
    await glimpse.save();
    await logActivity(req, 'Deleted', 'Glimpse Management', `Deleted glimpse image ID: ${imageId}`);
    res.json({ success: true, data: glimpse });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// --- COUNTERS ROUTES ---

// Add counter
router.post('/counters', verifyToken, async (req, res) => {
  try {
    const { icon, number, label, order } = req.body;
    let glimpse = await Glimpse.findOne();
    if (!glimpse) glimpse = new Glimpse();
    
    glimpse.counters.push({ icon, number, label, order, updatedBy: req.user.username, updatedAt: new Date() });
    glimpse.updatedBy = req.user.username;
    await glimpse.save();
    await logActivity(req, 'Created', 'Glimpse Management', `Added new counter: ${label}`);
    res.json({ success: true, data: glimpse });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update counter
router.put('/counters/:counterId', verifyToken, async (req, res) => {
  try {
    const { icon, number, label, order } = req.body;
    const { counterId } = req.params;
    let glimpse = await Glimpse.findOne();
    if (!glimpse) return res.status(404).json({ success: false, message: "Glimpse not found" });

    const counter = glimpse.counters.id(counterId);
    if (!counter) return res.status(404).json({ success: false, message: "Counter not found" });

    counter.icon = icon;
    counter.number = number;
    counter.label = label;
    counter.order = order;
    counter.updatedBy = req.user.username;
    counter.updatedAt = new Date();
    glimpse.updatedBy = req.user.username;

    await glimpse.save();
    await logActivity(req, 'Updated', 'Glimpse Management', `Updated counter: ${label}`);
    res.json({ success: true, data: glimpse });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Delete counter
router.delete('/counters/:counterId', verifyToken, async (req, res) => {
  try {
    const { counterId } = req.params;
    let glimpse = await Glimpse.findOne();
    if (!glimpse) return res.status(404).json({ success: false, message: "Glimpse not found" });

    glimpse.counters = glimpse.counters.filter(c => c._id.toString() !== counterId);
    glimpse.updatedBy = req.user.username;
    await glimpse.save();
    await logActivity(req, 'Deleted', 'Glimpse Management', `Deleted counter ID: ${counterId}`);
    res.json({ success: true, data: glimpse });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});


// Image upload
router.post('/upload', upload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No file uploaded" });
    }
    const relativePath = `/uploads/glimpse/${req.file.filename}`;
    res.json({ success: true, url: relativePath });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
