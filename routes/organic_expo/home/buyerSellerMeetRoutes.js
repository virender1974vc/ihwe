const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const buyerSellerMeetController = require('../../../controllers/organic_expo/home/buyerSellerMeetController');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = path.join(__dirname, '../../../../public/uploads/organic_expo');
        if (!fs.existsSync(uploadPath)) fs.mkdirSync(uploadPath, { recursive: true });
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        cb(null, `buyersellermeet-${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`);
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});

router.get('/', (req, res) => buyerSellerMeetController.getBuyerSellerMeet(req, res));

const uploadFields = [
    { name: 'image', maxCount: 1 }
];

router.post('/', upload.fields(uploadFields), (req, res) => buyerSellerMeetController.updateBuyerSellerMeet(req, res));

module.exports = router;
