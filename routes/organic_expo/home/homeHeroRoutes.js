const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const homeHeroController = require('../../../controllers/organic_expo/home/homeHeroController');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = path.join(__dirname, '../../../../public/uploads/organic_expo');
        if (!fs.existsSync(uploadPath)) fs.mkdirSync(uploadPath, { recursive: true });
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        cb(null, `homehero-${Date.now()}${path.extname(file.originalname)}`);
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});

// @route   GET /api/organic/home-hero
router.get('/', (req, res) => homeHeroController.getHomeHero(req, res));

// @route   POST /api/organic/home-hero
router.post('/', upload.single('img'), (req, res) => homeHeroController.updateHomeHero(req, res));

module.exports = router;
