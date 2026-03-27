const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const exhibitorController = require('../controllers/exhibitorController');

// Multer Config for Image Upload
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = 'uploads/exhibitors';
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
});

// GET all exhibitors
router.get('/', (req, res) => exhibitorController.getAllExhibitors(req, res));

// POST add new exhibitor
router.post('/', upload.single('image'), (req, res) => exhibitorController.addExhibitor(req, res));

// PUT update exhibitor
router.put('/:id', upload.single('image'), (req, res) => exhibitorController.updateExhibitor(req, res));

// DELETE exhibitor
router.delete('/:id', (req, res) => exhibitorController.deleteExhibitor(req, res));

module.exports = router;
