const express = require('express');
const router = express.Router();
const internationalBuyerController = require('../controllers/internationalBuyerController');
const internationalBuyerRegistrationConfigController = require('../controllers/internationalBuyerRegistrationConfigController');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = 'uploads/international_buyers';
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.fieldname}${path.extname(file.originalname)}`);
    }
});

const upload = multer({ storage });

const cpUpload = upload.fields([
    { name: 'companyRegistrationCertificate', maxCount: 1 },
    { name: 'taxRegistrationCertificate', maxCount: 1 },
    { name: 'passportCopy', maxCount: 1 },
    { name: 'productCatalogue', maxCount: 1 },
    { name: 'companyBrochure', maxCount: 1 },
    { name: 'logo', maxCount: 1 },
    { name: 'visitingCard', maxCount: 1 },
    { name: 'productCertifications', maxCount: 1 },
    { name: 'previousParticipationProof', maxCount: 1 },
    { name: 'paymentScreenshot', maxCount: 1 }
]);

// Configuration Routes
router.get('/config', internationalBuyerRegistrationConfigController.getConfig);
router.put('/config', internationalBuyerRegistrationConfigController.updateConfig);

router.get('/', internationalBuyerController.getAllRegistrations);
router.get('/:id', internationalBuyerController.getRegistrationById);
router.post('/register', cpUpload, internationalBuyerController.register);
router.put('/:id', internationalBuyerController.updateRegistration);
router.patch('/:id/status', internationalBuyerController.updateStatus);
router.delete('/:id', internationalBuyerController.deleteRegistration);

module.exports = router;
