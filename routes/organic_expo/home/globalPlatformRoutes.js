const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const globalPlatformController = require('../../../controllers/organic_expo/home/globalPlatformController');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = path.join(__dirname, '../../../../public/uploads/organic_expo');
        if (!fs.existsSync(uploadPath)) fs.mkdirSync(uploadPath, { recursive: true });
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        cb(null, `global-${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`);
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 },
});

router.get('/', (req, res) => globalPlatformController.getGlobalPlatform(req, res));

// We accept up to 10 icons for flexibility
const uploadFields = Array.from({ length: 10 }).map((_, i) => ({ name: `icon${i}`, maxCount: 1 }));
router.post('/', upload.fields(uploadFields), (req, res) => globalPlatformController.updateGlobalPlatform(req, res));

module.exports = router;
