const express = require('express');
const router = express.Router();
const NewTestimonial = require('../models/NewTestimonial');
const NewTestimonialCard = require('../models/NewTestimonialCard');
const NewTestimonialVideo = require('../models/NewTestimonialVideo');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = 'uploads/testimonials/';
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

// ─── GET ALL DATA ───
router.get('/', async (req, res) => {
  try {
    let settings = await NewTestimonial.findOne();
    if (!settings) {
      settings = new NewTestimonial({
        heroStats: [
          { icon: 'Globe', value: '1000+', label: 'Global Buyers', color: '#005c22ff' },
          { icon: 'Users', value: '8000+', label: 'Visitors/Delegates', color: '#004ac2ff' },
          { icon: 'Handshake', value: '150+', label: 'Exhibitors', color: '#00742aff' },
          { icon: 'Mic2', value: '150+', label: 'Expert Speakers', color: '#005f23ff' }
        ],
        bottomBarStats: [
          { icon: 'Leaf', label: 'Trusted by', value: '150+ Exhibitors' },
          { icon: 'Globe', label: 'Global Presence', value: '1000+ Global Buyers' },
          { icon: 'Building2', label: 'Government', value: 'Supported Initiative' },
          { icon: 'Users', label: 'Global Platform for', value: 'Health & Wellness' }
        ]
      });
      await settings.save();
    }

    const cards = await NewTestimonialCard.find().sort({ order: 1 });
    
    // Seed initial cards if empty
    if (cards.length === 0) {
      const initialCards = [
        {
          quote: "IHWE helped us connect with serious buyers and expand globally. The response was exceptional and beyond our expectations.",
          company1: "NatureCure",
          company2: "International",
          location: "Dubai, UAE",
          color: "#23471d"
        },
        {
          quote: "A powerful platform for healthcare innovation and meaningful networking. We met the right partners for our business.",
          company1: "MediWell",
          company2: "Research",
          location: "Toronto, Canada",
          color: "#1a4d8f"
        }
      ];
      await NewTestimonialCard.insertMany(initialCards);
    }

    const videos = await NewTestimonialVideo.find().sort({ order: 1 });
    
    // Seed initial videos if empty
    if (videos.length === 0) {
      const initialVideos = [
        { title: "NatureCure International", location: "Dubai, UAE", videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ" },
        { title: "MediWell Research", location: "Toronto, Canada", videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ" }
      ];
      await NewTestimonialVideo.insertMany(initialVideos);
    }

    const finalCards = await NewTestimonialCard.find().sort({ order: 1 });
    const finalVideos = await NewTestimonialVideo.find().sort({ order: 1 });

    res.json({ 
      success: true, 
      data: {
        settings, 
        cards: finalCards, 
        videos: finalVideos 
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ─── UPDATE SETTINGS ───
router.post('/settings', upload.fields([
  { name: 'heroBgImage', maxCount: 1 }
]), async (req, res) => {
  try {
    const updateData = { ...req.body };
    
    // Parse JSON arrays if they come as strings (common with FormData)
    if (typeof updateData.heroStats === 'string') {
      updateData.heroStats = JSON.parse(updateData.heroStats);
    }
    if (typeof updateData.bottomBarStats === 'string') {
      updateData.bottomBarStats = JSON.parse(updateData.bottomBarStats);
    }

    let settings = await NewTestimonial.findOne();
    if (!settings) settings = new NewTestimonial();

    Object.assign(settings, updateData);

    if (req.files && req.files.heroBgImage) {
      settings.heroBgImage = `/uploads/testimonials/${req.files.heroBgImage[0].filename}`;
    }

    await settings.save();
    res.json({ success: true, data: settings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ─── CARD ROUTES ───
router.post('/cards', upload.fields([
  { name: 'logo', maxCount: 1 },
  { name: 'bottomImage', maxCount: 1 }
]), async (req, res) => {
  try {
    const cardData = { ...req.body };
    if (req.files) {
      if (req.files.logo) cardData.logo = `/uploads/testimonials/${req.files.logo[0].filename}`;
      if (req.files.bottomImage) cardData.bottomImage = `/uploads/testimonials/${req.files.bottomImage[0].filename}`;
    }
    const card = new NewTestimonialCard(cardData);
    await card.save();
    res.json({ success: true, data: card });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/cards/:id', upload.fields([
  { name: 'logo', maxCount: 1 },
  { name: 'bottomImage', maxCount: 1 }
]), async (req, res) => {
  try {
    const cardData = { ...req.body };
    if (req.files) {
      if (req.files.logo) cardData.logo = `/uploads/testimonials/${req.files.logo[0].filename}`;
      if (req.files.bottomImage) cardData.bottomImage = `/uploads/testimonials/${req.files.bottomImage[0].filename}`;
    }
    const card = await NewTestimonialCard.findByIdAndUpdate(req.params.id, cardData, { new: true });
    res.json({ success: true, data: card });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.delete('/cards/:id', async (req, res) => {
  try {
    await NewTestimonialCard.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Card deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ─── VIDEO ROUTES ───
router.post('/videos', async (req, res) => {
  try {
    const video = new NewTestimonialVideo(req.body);
    await video.save();
    res.json({ success: true, data: video });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/videos/:id', async (req, res) => {
  try {
    const video = await NewTestimonialVideo.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, data: video });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.delete('/videos/:id', async (req, res) => {
  try {
    await NewTestimonialVideo.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Video deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
