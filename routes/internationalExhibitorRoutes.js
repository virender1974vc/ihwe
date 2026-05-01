const express = require('express');
const router = express.Router();
const internationalExhibitorController = require('../controllers/internationalExhibitorController');
const internationalExhibitorConfigController = require('../controllers/internationalExhibitorConfigController');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = 'uploads/international_exhibitors';
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
    { name: 'previousParticipationProof', maxCount: 1 }
]);

router.get('/', internationalExhibitorController.getAllRegistrations);
router.get('/config', internationalExhibitorConfigController.getConfig);
router.put('/config', internationalExhibitorConfigController.updateConfig);
router.get('/:id', internationalExhibitorController.getRegistrationById);
router.post('/register', cpUpload, internationalExhibitorController.register);
router.patch('/:id/status', internationalExhibitorController.updateStatus);
router.delete('/:id', internationalExhibitorController.deleteRegistration);

module.exports = router;
