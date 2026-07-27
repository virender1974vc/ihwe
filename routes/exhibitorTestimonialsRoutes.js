const express = require('express');
const router = express.Router();
const exhibitorTestimonialsController = require('../controllers/exhibitorTestimonialsController');
const { verifyToken } = require('../utils/verifyToken');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

// Multer storage configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = path.join(__dirname, '../uploads/exhibitor-testimonials');
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
    storage: storage,
    limits: { fileSize: 2 * 1024 * 1024 }, // 2MB limit
    fileFilter: (req, file, cb) => {
        const filetypes = /jpeg|jpg|png|webp/;
        const mimetype = filetypes.test(file.mimetype);
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        if (mimetype && extname) return cb(null, true);
        cb(new Error('Only images are allowed'));
    }
});

router.get('/', exhibitorTestimonialsController.getExhibitorTestimonials);
router.post('/headings', verifyToken, exhibitorTestimonialsController.updateHeadings);
router.post('/cards', verifyToken, exhibitorTestimonialsController.addCard);
router.put('/cards/:cardId', verifyToken, exhibitorTestimonialsController.updateCard);
router.delete('/cards/:cardId', verifyToken, exhibitorTestimonialsController.deleteCard);

// Image upload route
router.post('/image', verifyToken, upload.single('image'), exhibitorTestimonialsController.uploadImage);

module.exports = router;
