const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const introController = require('../../../controllers/organic_expo/home/introductionSectionController');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = path.join(__dirname, '../../../../public/uploads/organic_expo');
        if (!fs.existsSync(uploadPath)) fs.mkdirSync(uploadPath, { recursive: true });
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        cb(null, `intro-${Date.now()}${path.extname(file.originalname)}`);
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 },
});

router.get('/', (req, res) => introController.getIntroduction(req, res));
router.post('/', upload.single('image'), (req, res) => introController.updateIntroduction(req, res));

module.exports = router;
