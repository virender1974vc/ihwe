const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const nominationController = require('../controllers/advisoryNominationController');

// Multer config for CV uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = './uploads/advisory/cv';
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        cb(null, 'CV-' + Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// Submit nomination
router.post('/', upload.single('cv'), (req, res) => nominationController.submitNomination(req, res));

// Admin routes
router.get('/', (req, res) => nominationController.getAllNominations(req, res));
router.get('/:id', (req, res) => nominationController.getNominationById(req, res));
router.patch('/:id/status', (req, res) => nominationController.updateStatus(req, res));

module.exports = router;
