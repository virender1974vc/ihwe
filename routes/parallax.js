const express = require('express');
const router = express.Router();
const Parallax = require('../models/Parallax');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Storage for images
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = './uploads/parallax';
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

// Get parallax data
router.get('/', async (req, res) => {
  try {
    let parallax = await Parallax.findOne();
    if (!parallax) {
      parallax = new Parallax();
      await parallax.save();
    }
    res.json({ success: true, data: parallax });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update parallax data
router.post('/', async (req, res) => {
  try {
    const { subheading, heading, highlightText, description, buttonText, buttonUrl, imageUrl } = req.body;
    let parallax = await Parallax.findOne();
    
    if (!parallax) {
      parallax = new Parallax({ subheading, heading, highlightText, description, buttonText, buttonUrl, imageUrl });
    } else {
      parallax.subheading = subheading;
      parallax.heading = heading;
      parallax.highlightText = highlightText;
      parallax.description = description;
      parallax.buttonText = buttonText;
      parallax.buttonUrl = buttonUrl;
      if (imageUrl) parallax.imageUrl = imageUrl;
    }
    
    await parallax.save();
    res.json({ success: true, data: parallax });
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
    const relativePath = `/uploads/parallax/${req.file.filename}`;
    res.json({ success: true, url: relativePath });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
