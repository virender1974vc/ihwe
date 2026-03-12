const express = require('express');
const router = express.Router();
const Client = require('../models/Client');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Storage for images
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = './uploads/clients';
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

// Get all client data
router.get('/', async (req, res) => {
  try {
    let client = await Client.findOne();
    if (!client) {
      client = new Client();
      await client.save();
    }
    res.json({ success: true, data: client });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update headings
router.post('/headings', async (req, res) => {
  try {
    const { subheading, heading, highlightText } = req.body;
    let client = await Client.findOne();
    if (!client) {
      client = new Client({ subheading, heading, highlightText });
    } else {
      client.subheading = subheading;
      client.heading = heading;
      client.highlightText = highlightText;
    }
    await client.save();
    res.json({ success: true, data: client });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Add image card
router.post('/images', async (req, res) => {
  try {
    const { url, altText } = req.body;
    let client = await Client.findOne();
    if (!client) {
      client = new Client();
    }
    client.images.push({ url, altText });
    await client.save();
    res.json({ success: true, data: client });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update image card
router.put('/images/:imageId', async (req, res) => {
  try {
    const { url, altText } = req.body;
    const { imageId } = req.params;
    let client = await Client.findOne();
    if (!client) return res.status(404).json({ success: false, message: "Client data not found" });

    const image = client.images.id(imageId);
    if (!image) return res.status(404).json({ success: false, message: "Image not found" });

    image.url = url;
    image.altText = altText;

    await client.save();
    res.json({ success: true, data: client });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Delete image card
router.delete('/images/:imageId', async (req, res) => {
  try {
    const { imageId } = req.params;
    let client = await Client.findOne();
    if (!client) return res.status(404).json({ success: false, message: "Client data not found" });

    client.images = client.images.filter(img => img._id.toString() !== imageId);
    await client.save();
    res.json({ success: true, data: client });
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
    const relativePath = `/uploads/clients/${req.file.filename}`;
    res.json({ success: true, url: relativePath });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
