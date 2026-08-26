const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const expoCategoriesController = require('../../../controllers/organic_expo/home/expoCategoriesController');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = path.join(__dirname, '../../../../public/uploads/organic_expo');
        if (!fs.existsSync(uploadPath)) fs.mkdirSync(uploadPath, { recursive: true });
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        cb(null, `expocategories-${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`);
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit for image
});

router.get('/', (req, res) => expoCategoriesController.getExpoCategories(req, res));

// We accept up to 20 images just in case
const uploadFields = Array.from({ length: 20 }).map((_, i) => ({ name: `categoryImage${i}`, maxCount: 1 }));
router.post('/', upload.fields(uploadFields), (req, res) => expoCategoriesController.updateExpoCategories(req, res));

module.exports = router;
