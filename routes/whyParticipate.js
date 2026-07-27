const express = require('express');
const router = express.Router();
const WhyParticipate = require('../models/WhyParticipate');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = 'uploads/';
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname.replace(/\s+/g, '-'));
  }
});

const upload = multer({ storage });

// GET WhyParticipate data (Seeds if not exists)
router.get('/', async (req, res) => {
  try {
    let data = await WhyParticipate.findOne();
    if (!data) {
      data = new WhyParticipate();
      await data.save();
    }
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update WhyParticipate settings and files
router.post('/settings', upload.fields([
  { name: 'image', maxCount: 1 },
  { name: 'brochure', maxCount: 1 }
]), async (req, res) => {
  try {
    const updateData = { ...req.body };
    
    // Parse JSON fields if they are sent as strings
    if (typeof updateData.keyPoints === 'string') {
      try {
        updateData.keyPoints = JSON.parse(updateData.keyPoints);
      } catch (e) {
        updateData.keyPoints = updateData.keyPoints.split(',').map(p => p.trim());
      }
    }
    if (typeof updateData.mainPoints === 'string') {
      try {
        updateData.mainPoints = JSON.parse(updateData.mainPoints);
      } catch (e) {
        updateData.mainPoints = updateData.mainPoints.split(',').map(p => p.trim());
      }
    }

    let data = await WhyParticipate.findOne();
    if (!data) data = new WhyParticipate();

    // Update text fields
    Object.keys(updateData).forEach(key => {
      if (updateData[key] !== undefined) {
        data[key] = updateData[key];
      }
    });

    // Handle file uploads
    if (req.files) {
      if (req.files.image && req.files.image[0]) {
        data.image = `/uploads/${req.files.image[0].filename}`;
      }
      if (req.files.brochure && req.files.brochure[0]) {
        data.button2File = `/uploads/${req.files.brochure[0].filename}`;
      }
    }

    await data.save();
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
