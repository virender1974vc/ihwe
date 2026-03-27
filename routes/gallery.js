const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const galleryController = require('../controllers/galleryController');

// Storage for gallery assets
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        let dir = './uploads/gallery';
        if (file.mimetype.startsWith('video/')) {
            dir = './uploads/gallery/videos';
        } else {
            dir = './uploads/gallery/images';
        }
        
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({ 
    storage: storage,
    limits: {
        fileSize: 50 * 1024 * 1024 // 50MB limit for videos
    }
});

// Get all gallery items (filtered by category if provided)
router.get('/', (req, res) => galleryController.getAllItems(req, res));

// Add new gallery item
router.post('/', (req, res) => galleryController.createItem(req, res));

// Update gallery item
router.put('/:id', (req, res) => galleryController.updateItem(req, res));

// Delete gallery item
router.delete('/:id', (req, res) => galleryController.deleteItem(req, res));

// Generic upload endpoint
router.post('/upload', upload.single('file'), (req, res) => galleryController.uploadFile(req, res));

module.exports = router;
