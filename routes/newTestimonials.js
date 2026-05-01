const express = require('express');
const router = express.Router();
const NewTestimonial = require('../models/NewTestimonial');
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

// GET data (Seeds if not exists)
router.get('/', async (req, res) => {
  try {
    let data = await NewTestimonial.findOne();
    if (!data) {
      data = new NewTestimonial({
        testimonials: [
          {
            description: "A game-changing event for the organic wellness industry. We forged partnerships that will last decades.",
            authorName: "NatureCure International",
            location: "Dubai, UAE",
            icon: "Quote"
          },
          {
            description: "The sessions at IHWE redefined how we approach integrative medicine. Absolutely world-class.",
            authorName: "MediWell Research",
            location: "Toronto, Canada",
            icon: "Sparkles"
          }
        ]
      });
      await data.save();
    }
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update Settings & Images
router.post('/settings', upload.fields([
  { name: 'leftBgImage', maxCount: 1 },
  { name: 'rightBgImage', maxCount: 1 }
]), async (req, res) => {
  try {
    const { subtitle, heading, description, leftBgAlt, rightBgAlt, highlightCardText } = req.body;
    let data = await NewTestimonial.findOne();
    if (!data) data = new NewTestimonial();

    if (subtitle !== undefined) data.subtitle = subtitle;
    if (heading !== undefined) data.heading = heading;
    if (description !== undefined) data.description = description;
    if (leftBgAlt !== undefined) data.leftBgAlt = leftBgAlt;
    if (rightBgAlt !== undefined) data.rightBgAlt = rightBgAlt;
    if (highlightCardText !== undefined) data.highlightCardText = highlightCardText;
    
    if (req.files) {
      if (req.files.leftBgImage) {
        data.leftBgImage = `/uploads/${req.files.leftBgImage[0].filename}`;
      }
      if (req.files.rightBgImage) {
        data.rightBgImage = `/uploads/${req.files.rightBgImage[0].filename}`;
      }
    }
    
    await data.save();
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Add Testimonial
router.post('/testimonials', async (req, res) => {
  try {
    const { icon, description, authorName, location, order } = req.body;
    const data = await NewTestimonial.findOne();
    if (!data) return res.status(404).json({ success: false, message: 'Settings not found' });

    data.testimonials.push({ icon, description, authorName, location, order });
    await data.save();
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update Testimonial
router.put('/testimonials/:id', async (req, res) => {
  try {
    const { icon, description, authorName, location, order } = req.body;
    const data = await NewTestimonial.findOne();
    if (!data) return res.status(404).json({ success: false, message: 'Settings not found' });

    const testimonial = data.testimonials.id(req.params.id);
    if (!testimonial) return res.status(404).json({ success: false, message: 'Testimonial not found' });

    if (icon !== undefined) testimonial.icon = icon;
    if (description !== undefined) testimonial.description = description;
    if (authorName !== undefined) testimonial.authorName = authorName;
    if (location !== undefined) testimonial.location = location;
    if (order !== undefined) testimonial.order = order;

    await data.save();
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Delete Testimonial
router.delete('/testimonials/:id', async (req, res) => {
  try {
    const data = await NewTestimonial.findOne();
    if (!data) return res.status(404).json({ success: false, message: 'Settings not found' });

    data.testimonials.pull(req.params.id);
    await data.save();
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
