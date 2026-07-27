const express = require('express');
const router = express.Router();
const SupportedBy = require('../models/SupportedBy');

// GET SupportedBy data (Seeds if not exists)
router.get('/', async (req, res) => {
  try {
    let data = await SupportedBy.findOne();
    if (!data) {
      data = new SupportedBy({
        title: 'Supported By',
        bgColor: '#23471d',
        items: [
          { icon: 'Stethoscope', label: 'HEALTHCARE', label2: 'LEADERS', order: 1 },
          { icon: 'Landmark', label: 'GOVERNMENT', label2: 'BODIES', order: 2 },
          { icon: 'Leaf', label: 'AYUSH', label2: 'INDUSTRY', order: 3 },
          { icon: 'Globe', label: 'INTERNATIONAL', label2: 'BUYERS', order: 4 },
          { icon: 'Building2', label: 'HOSPITAL & CLINIC', label2: 'PROCUREMENT TEAMS', order: 5 },
          { icon: 'GraduationCap', label: 'UNIVERSITY/', label2: 'ACADEMIC PARTNERS', order: 6 }
        ]
      });
      await data.save();
    }
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update Headings & BG Color
router.post('/settings', async (req, res) => {
  try {
    const { title, bgColor } = req.body;
    let data = await SupportedBy.findOne();
    if (!data) data = new SupportedBy();

    data.title = title || data.title;
    data.bgColor = bgColor || data.bgColor;
    
    await data.save();
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Add Item
router.post('/items', async (req, res) => {
  try {
    const { icon, label, label2, order } = req.body;
    const data = await SupportedBy.findOne();
    if (!data) return res.status(404).json({ success: false, message: 'Settings not found' });

    data.items.push({ icon, label, label2, order, updatedBy: req.user?.name || 'Admin' });
    await data.save();
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update Item
router.put('/items/:id', async (req, res) => {
  try {
    const { icon, label, label2, order } = req.body;
    const data = await SupportedBy.findOne();
    if (!data) return res.status(404).json({ success: false, message: 'Settings not found' });

    const item = data.items.id(req.params.id);
    if (!item) return res.status(404).json({ success: false, message: 'Item not found' });

    item.icon = icon;
    item.label = label;
    item.label2 = label2;
    item.order = order;
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
    const data = await SupportedBy.findOne();
    if (!data) return res.status(404).json({ success: false, message: 'Settings not found' });

    data.items.pull(req.params.id);
    await data.save();
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
