const express = require('express');
const router = express.Router();
const UpcomingBrand = require('../models/UpcomingBrand');
const multer = require('multer');
const fs = require('fs');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        let dir = './uploads/brands';
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname.replace(/\s+/g, '-'));
    }
});

const upload = multer({ storage: storage });

// GET UpcomingBrands data (Seeds if not exists)
router.get('/', async (req, res) => {
  try {
    let data = await UpcomingBrand.findOne();
    if (!data) {
      data = new UpcomingBrand({
        title: 'UPCOMING LEADING BRANDS',
        items: []
      });
      await data.save();
    }
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update Headings
router.post('/settings', async (req, res) => {
  try {
    const { title } = req.body;
    let data = await UpcomingBrand.findOne();
    if (!data) data = new UpcomingBrand();

    data.title = title || data.title;
    
    await data.save();
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Add Item
router.post('/items', upload.single('logo'), async (req, res) => {
  try {
    const { altText, order } = req.body;
    const data = await UpcomingBrand.findOne();
    if (!data) return res.status(404).json({ success: false, message: 'Settings not found' });

    let logoPath = '';
    if (req.file) {
        logoPath = `/uploads/brands/${req.file.filename}`;
    } else {
        return res.status(400).json({ success: false, message: 'Logo image is required' });
    }

    data.items.push({ 
        logo: logoPath, 
        altText: altText || '', 
        order: parseInt(order) || 0,
        updatedBy: req.user?.name || 'Admin' 
    });
    
    await data.save();
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update Item
router.put('/items/:id', upload.single('logo'), async (req, res) => {
  try {
    const { altText, order } = req.body;
    const data = await UpcomingBrand.findOne();
    if (!data) return res.status(404).json({ success: false, message: 'Settings not found' });

    const item = data.items.id(req.params.id);
    if (!item) return res.status(404).json({ success: false, message: 'Item not found' });

    if (req.file) {
        item.logo = `/uploads/brands/${req.file.filename}`;
    }
    if (altText !== undefined) item.altText = altText;
    if (order !== undefined) item.order = parseInt(order) || 0;
    
    item.updatedAt = Date.now();
    item.updatedBy = req.user?.name || 'Admin';

    await data.save();
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Delete Item
router.delete('/items/:id', async (req, res) => {
  try {
    const data = await UpcomingBrand.findOne();
    if (!data) return res.status(404).json({ success: false, message: 'Settings not found' });

    data.items.pull(req.params.id);
    await data.save();
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
