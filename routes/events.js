const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const router = express.Router();
const eventController = require('../controllers/eventController');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = path.join(__dirname, '../uploads/event-booking-forms');
        if (!fs.existsSync(uploadPath)) fs.mkdirSync(uploadPath, { recursive: true });
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        cb(null, `booking-form-${Date.now()}${path.extname(file.originalname)}`);
    }
});

const upload = multer({
    storage,
    fileFilter: (req, file, cb) => {
        const allowed = /pdf|doc|docx|jpg|jpeg|png/i;
        const ext = path.extname(file.originalname || '').replace('.', '');
        if (allowed.test(ext)) return cb(null, true);
        cb(new Error('Only PDF, DOC, DOCX, JPG and PNG files are allowed'));
    }
});

router.get('/', eventController.getAllEvents);
router.get('/active', eventController.getActiveEvents);
router.get('/current', eventController.getCurrentEvent);
router.get('/:id', eventController.getEventById);
router.post('/', upload.single('bookingForm'), eventController.addEvent);
router.put('/:id', upload.single('bookingForm'), eventController.updateEvent);
router.delete('/:id', eventController.deleteEvent);

module.exports = router;
