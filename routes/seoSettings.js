const express = require('express');
const router = express.Router();
const Settings = require('../models/Settings');
const SeoFile = require('../models/SeoFile');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer for SEO Files (sitemap.xml, robots.txt, etc.)
// These files will be saved in root dynamic-seo-files directory
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = 'uploads/seo-files/';
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        // We keep original name for sitemap.xml, robots.txt, etc.
        // But to avoid conflicts, we might want to be careful.
        // For SEO files, they USUALLY want specific names.
        cb(null, file.originalname);
    }
});

const upload = multer({ storage: storage });

// Get Advanced SEO settings (scripts and files)
router.get('/advanced', async (req, res) => {
    try {
        let settings = await Settings.findOne();
        if (!settings) settings = new Settings({});
        
        const seoFiles = await SeoFile.find().sort({ createdAt: -1 });
        
        res.json({
            success: true,
            data: {
                headerScripts: settings.headerScripts || '',
                footerScripts: settings.footerScripts || '',
                seoFiles
            }
        });
    } catch (error) {
        console.error('Advanced SEO Fetch error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Update global scripts
router.put('/scripts', async (req, res) => {
    try {
        const { headerScripts, footerScripts } = req.body;
        
        let settings = await Settings.findOne();
        if (!settings) settings = new Settings({});
        
        settings.headerScripts = headerScripts;
        settings.footerScripts = footerScripts;
        
        await settings.save();
        res.json({ success: true, message: 'Global scripts updated' });
    } catch (error) {
        console.error('Scripts update error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Upload SEO File
router.post('/upload-file', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No file uploaded' });
        }

        // Delete existing file with same name if exists in DB
        await SeoFile.findOneAndDelete({ originalName: req.file.originalname });

        const seoFile = new SeoFile({
            originalName: req.file.originalname,
            filename: req.file.filename,
            path: `/uploads/seo-files/${req.file.filename}`,
            mimetype: req.file.mimetype,
            size: req.file.size
        });

        await seoFile.save();
        
        const allFiles = await SeoFile.find().sort({ createdAt: -1 });
        res.json({ success: true, message: 'File uploaded', data: allFiles });
    } catch (error) {
        console.error('File upload error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Delete SEO File
router.delete('/file/:id', async (req, res) => {
    try {
        const file = await SeoFile.findById(req.params.id);
        if (!file) {
            return res.status(404).json({ success: false, message: 'File not found' });
        }

        // Remove from physical storage
        const filePath = path.join(__dirname, '../', file.path);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }

        await SeoFile.findByIdAndDelete(req.params.id);
        
        const allFiles = await SeoFile.find().sort({ createdAt: -1 });
        res.json({ success: true, message: 'File deleted', data: allFiles });
    } catch (error) {
        console.error('File delete error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router;
