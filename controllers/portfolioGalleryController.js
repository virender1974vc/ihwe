const GalleryItem = require("../models/GalleryItem");
const { logActivity } = require("../utils/logger");

exports.getAllGallery = async (req, res) => {
  try {
    const items = await GalleryItem.find().sort({ createdAt: -1 });
    res.json({ success: true, data: items });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.createGallery = async (req, res) => {
  try {
    const item = await GalleryItem.create(req.body);
    await logActivity(req, 'Created', 'Portfolio Gallery', `Added new gallery item: ${req.body.title || 'Untitled'}`);
    res.status(201).json({ success: true, data: item });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.addImages = async (req, res) => {
  try {
    // Basic implementation for adding multiple images
    const { images, ...rest } = req.body;
    if (Array.isArray(images)) {
        const items = await GalleryItem.insertMany(images.map(img => ({ ...rest, image: img, mediaType: 'image' })));
        await logActivity(req, 'Created', 'Portfolio Gallery', `Bulk added ${items.length} gallery images`);
        return res.status(201).json({ success: true, data: items });
    }
    const item = await GalleryItem.create(req.body);
    await logActivity(req, 'Created', 'Portfolio Gallery', `Added gallery item: ${req.body.title || 'Untitled'}`);
    res.status(201).json({ success: true, data: item });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.deleteGallery = async (req, res) => {
  try {
    const item = await GalleryItem.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json({ success: false, message: "Item not found" });
    await logActivity(req, 'Deleted', 'Portfolio Gallery', `Deleted gallery item ID: ${req.params.id}`);
    res.json({ success: true, message: "Item deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
