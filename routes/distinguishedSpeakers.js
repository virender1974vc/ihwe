const express = require('express');
const router = express.Router();
const DistinguishedSpeaker = require('../models/DistinguishedSpeaker');
const multer = require('multer');
const fs = require('fs');

// Multer storage for speaker images
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = 'uploads/speakers/';
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

// GET ALL SPEAKERS
router.get('/', async (req, res) => {
  try {
    const speakers = await DistinguishedSpeaker.find().sort({ order: 1 });
    res.json({ success: true, data: speakers });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ADD NEW SPEAKER
router.post('/', upload.single('image'), async (req, res) => {
  try {
    const speakerData = { ...req.body };
    if (req.file) {
      speakerData.image = `/uploads/speakers/${req.file.filename}`;
    }
    const speaker = new DistinguishedSpeaker(speakerData);
    await speaker.save();
    res.json({ success: true, data: speaker });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// UPDATE SPEAKER
router.put('/:id', upload.single('image'), async (req, res) => {
  try {
    const speakerData = { ...req.body };
    if (req.file) {
      speakerData.image = `/uploads/speakers/${req.file.filename}`;
    }
    const speaker = await DistinguishedSpeaker.findByIdAndUpdate(req.params.id, speakerData, { new: true });
    res.json({ success: true, data: speaker });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// DELETE SPEAKER
router.delete('/:id', async (req, res) => {
  try {
    await DistinguishedSpeaker.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Speaker deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
