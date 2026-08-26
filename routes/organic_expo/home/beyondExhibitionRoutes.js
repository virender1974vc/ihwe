const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const beyondExhibitionController = require('../../../controllers/organic_expo/home/beyondExhibitionController');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = path.join(__dirname, '../../../../public/uploads/organic_expo');
        if (!fs.existsSync(uploadPath)) fs.mkdirSync(uploadPath, { recursive: true });
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        cb(null, `beyondexhibition-${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`);
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit for image
});

router.get('/', (req, res) => beyondExhibitionController.getBeyondExhibition(req, res));

const uploadFields = [
    { name: 'image', maxCount: 1 }
];

router.post('/', upload.fields(uploadFields), (req, res) => beyondExhibitionController.updateBeyondExhibition(req, res));

module.exports = router;
