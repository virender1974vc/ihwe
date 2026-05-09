const express = require('express');
const router = express.Router();
const conferenceTestimonialsController = require('../controllers/conferenceTestimonialsController');

const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Multer Storage Configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = path.join(__dirname, '../uploads/conference-testimonials');
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        cb(null, `testimonial-${Date.now()}${path.extname(file.originalname)}`);
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

// GET all conference testimonials data
router.get('/', (req, res) => conferenceTestimonialsController.getTestimonials(req, res));

// POST update headings
router.post('/headings', (req, res) => conferenceTestimonialsController.updateHeadings(req, res));

// POST add new card
router.post('/cards', upload.single('image'), (req, res) => conferenceTestimonialsController.addCard(req, res));

// PUT update card
router.put('/cards/:id', upload.single('image'), (req, res) => conferenceTestimonialsController.updateCard(req, res));

// DELETE card
router.delete('/cards/:id', (req, res) => conferenceTestimonialsController.deleteCard(req, res));

module.exports = router;
