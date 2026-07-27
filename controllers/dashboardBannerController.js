const DashboardBanner = require('../models/DashboardBanner');
const fs = require('fs');
const path = require('path');

const deleteFile = (filePath) => {
    const abs = path.join(__dirname, '..', filePath);
    if (fs.existsSync(abs)) fs.unlinkSync(abs);
};

// Get all banners (Admin)
exports.getAllBanners = async (req, res) => {
    try {
        const banners = await DashboardBanner.find().sort({ type: 1, pageId: 1 });
        res.json({ success: true, data: banners });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// Get banner for a specific page
exports.getBannerByPage = async (req, res) => {
    try {
        const banner = await DashboardBanner.findOne({ pageId: req.params.pageId });
        res.json({ success: true, data: banner });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// Create or Update Banner (Admin)
exports.upsertBanner = async (req, res) => {
    try {
        const { pageId, title, subtitle, type } = req.body;
        let imageUrl;
        
        if (req.file) {
            imageUrl = `/uploads/banners/${req.file.filename}`;
        }

        let banner = await DashboardBanner.findOne({ pageId });
        
        if (banner) {
            if (imageUrl && banner.imageUrl) deleteFile(banner.imageUrl);
            banner.title = title || banner.title;
            banner.subtitle = subtitle || banner.subtitle;
            banner.type = type || banner.type;
            if (imageUrl) banner.imageUrl = imageUrl;
            await banner.save();
        } else {
            if (!imageUrl) return res.status(400).json({ success: false, message: "Image is required for new banner" });
            banner = await DashboardBanner.create({ pageId, title, subtitle, type, imageUrl });
        }

        res.json({ success: true, data: banner });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

// Delete Banner (Admin)
exports.deleteBanner = async (req, res) => {
    try {
        const banner = await DashboardBanner.findById(req.params.id);
        if (banner && banner.imageUrl) deleteFile(banner.imageUrl);
        await DashboardBanner.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: "Banner deleted" });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
