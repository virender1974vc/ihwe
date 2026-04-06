const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const heroController = require('../controllers/heroController');
const { verifyToken } = require('../utils/verifyToken');

// Multer Storage Configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = path.join(__dirname, '../uploads/hero');
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        cb(null, `hero-${Date.now()}${path.extname(file.originalname)}`);
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        const filetypes = /jpeg|jpg|png|webp/;
        const mimetype = filetypes.test(file.mimetype);
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        if (mimetype && extname) {
            return cb(null, true);
        }
        cb(new Error('Only images are allowed'));
    }
});

// @route   POST /api/hero/create
// @desc    Create a new hero slide
router.post('/create', verifyToken, upload.single('image'), (req, res) => heroController.createSlide(req, res));

// @route   GET /api/hero/all
// @desc    Get all hero slides
router.get('/all', (req, res) => heroController.getAllSlides(req, res));

// @route   PUT /api/hero/update/:id
// @desc    Update a hero slide
router.put('/update/:id', verifyToken, upload.single('image'), (req, res) => heroController.updateSlide(req, res));

// @route   DELETE /api/hero/delete/:id
// @desc    Delete a hero slide
router.delete('/delete/:id', verifyToken, (req, res) => heroController.deleteSlide(req, res));

module.exports = router;
