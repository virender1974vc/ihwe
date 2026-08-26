const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const partnersAndBrandsController = require('../../../controllers/organic_expo/home/partnersAndBrandsController');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = path.join(__dirname, '../../../../public/uploads/organic_expo');
        if (!fs.existsSync(uploadPath)) fs.mkdirSync(uploadPath, { recursive: true });
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        cb(null, `partnersbrands-${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`);
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit per image
});

router.get('/', (req, res) => partnersAndBrandsController.getPartnersAndBrands(req, res));

// Use upload.any() because we have dynamic array field names like industryLeadersLogos_0, knowledgeLogos_2, etc.
router.post('/', upload.any(), (req, res) => partnersAndBrandsController.updatePartnersAndBrands(req, res));

module.exports = router;
