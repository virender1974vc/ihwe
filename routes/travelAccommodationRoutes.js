const express = require('express');
const router = express.Router();
const { 
    getTravelAccommodation, 
    updateHeadings, 
    addHotel, 
    updateHotel,
    deleteHotel, 
    addCommute, 
    updateCommute,
    deleteCommute,
    uploadImage
} = require('../controllers/travelAccommodationController');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Multer for hotel images
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = path.join(__dirname, '../uploads/travel-accommodation');
        if (!fs.existsSync(uploadPath)) fs.mkdirSync(uploadPath, { recursive: true });
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        cb(null, `hotel-${Date.now()}${path.extname(file.originalname)}`);
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }
});

router.get('/', getTravelAccommodation);
router.post('/update-headings', updateHeadings);
router.post('/hotel/add', addHotel);
router.put('/hotel/:id', updateHotel);
router.delete('/hotel/:id', deleteHotel);
router.post('/commute/add', addCommute);
router.put('/commute/:id', updateCommute);
router.delete('/commute/:id', deleteCommute);
router.post('/upload', upload.single('image'), uploadImage);

module.exports = router;
