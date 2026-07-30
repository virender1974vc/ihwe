const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const countersController = require('../controllers/countersController');
const optimizeImage = require('../middleware/optimizeImage');
const cacheControl = require('../middleware/cacheControl');

// Multer Storage Configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = 'uploads/counters';
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        cb(null, `counter-${Date.now()}${path.extname(file.originalname)}`);
    }
});

const upload = multer({ storage });

// GET all counters
router.get('/', cacheControl(120), (req, res) => countersController.getAllCounters(req, res));

// POST new counter
router.post('/', upload.single('image'), optimizeImage, (req, res) => countersController.createCounter(req, res));

// PUT update counter
router.put('/:id', upload.single('image'), optimizeImage, (req, res) => countersController.updateCounter(req, res));

// CLEANUP blank counters
router.get('/cleanup', (req, res) => countersController.cleanupBlankCounters(req, res));

// DELETE counter
router.delete('/:id', (req, res) => countersController.deleteCounter(req, res));

module.exports = router;
