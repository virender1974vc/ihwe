const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const advisoryController = require('../controllers/advisoryController');

// Storage for images
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = './uploads/advisory';
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({ storage: storage });

// Get all advisory members
router.get('/', (req, res) => advisoryController.getAllMembers(req, res));

// Add new advisory member
router.post('/', (req, res) => advisoryController.createMember(req, res));

// Update advisory member
router.put('/:id', (req, res) => advisoryController.updateMember(req, res));

// Delete advisory member
router.delete('/:id', (req, res) => advisoryController.deleteMember(req, res));

// Image upload
router.post('/upload', upload.single('image'), (req, res) => advisoryController.uploadImage(req, res));

module.exports = router;
