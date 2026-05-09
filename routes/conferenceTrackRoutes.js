const express = require('express');
const router = express.Router();
const conferenceTrackController = require('../controllers/conferenceTrackController');
const { verifyToken } = require('../utils/verifyToken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Multer Config
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = path.join(__dirname, '../uploads/conference-tracks');
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        cb(null, `track-${Date.now()}${path.extname(file.originalname)}`);
    }
});

const upload = multer({ storage });

router.get('/', conferenceTrackController.getAll);
router.post('/', verifyToken, upload.single('image'), conferenceTrackController.create);
router.put('/:id', verifyToken, upload.single('image'), conferenceTrackController.update);
router.delete('/:id', verifyToken, conferenceTrackController.delete);
router.post('/order', verifyToken, conferenceTrackController.updateOrder);

module.exports = router;
