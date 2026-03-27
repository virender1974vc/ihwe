const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const countersController = require('../controllers/countersController');

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
router.get('/', (req, res) => countersController.getAllCounters(req, res));

// POST new counter
router.post('/', upload.single('image'), (req, res) => countersController.createCounter(req, res));

// PUT update counter
router.put('/:id', upload.single('image'), (req, res) => countersController.updateCounter(req, res));

// DELETE counter
router.delete('/:id', (req, res) => countersController.deleteCounter(req, res));

module.exports = router;
