const express = require('express');
const router = express.Router();
const Glimpse = require('../models/Glimpse');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

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
      glimpse = new Glimpse();
      await glimpse.save();
    }
    res.json({ success: true, data: glimpse });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update headings
router.post('/headings', async (req, res) => {
  try {
    const { subheading, heading, highlightText, description } = req.body;
    let glimpse = await Glimpse.findOne();
    if (!glimpse) {
      glimpse = new Glimpse({ subheading, heading, highlightText, description });
    } else {
      glimpse.subheading = subheading;
      glimpse.heading = heading;
      glimpse.highlightText = highlightText;
      glimpse.description = description;
    }
    await glimpse.save();
    res.json({ success: true, data: glimpse });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Add image card
router.post('/images', async (req, res) => {
  try {
    const { url, title, altText } = req.body;
    let glimpse = await Glimpse.findOne();
    if (!glimpse) {
      glimpse = new Glimpse();
    }
    glimpse.images.push({ url, title, altText });
    await glimpse.save();
    res.json({ success: true, data: glimpse });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update image card
router.put('/images/:imageId', async (req, res) => {
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

    await glimpse.save();
    res.json({ success: true, data: glimpse });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Delete image card
router.delete('/images/:imageId', async (req, res) => {
  try {
    const { imageId } = req.params;
    let glimpse = await Glimpse.findOne();
    if (!glimpse) return res.status(404).json({ success: false, message: "Glimpse not found" });

    glimpse.images = glimpse.images.filter(img => img._id.toString() !== imageId);
    await glimpse.save();
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
