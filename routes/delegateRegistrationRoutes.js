const express = require('express');
const router = express.Router();
const delegateRegistrationController = require('../controllers/delegateRegistrationController');
const fs = require('fs');
const path = require('path');
const multer = require('multer');

// Configure multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../uploads/delegates');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});
const upload = multer({ storage });

const { authMiddleware } = require('../middleware/authMiddleware');

router.post('/register', upload.single('profileImage'), delegateRegistrationController.createRegistration);
router.post('/verify', delegateRegistrationController.verifyPayment);
router.post('/exhibitor-complimentary', authMiddleware, upload.single('profileImage'), delegateRegistrationController.createExhibitorComplimentaryRegistration);
router.post('/registration/exhibitor-complimentary', authMiddleware, upload.single('profileImage'), delegateRegistrationController.createExhibitorComplimentaryRegistration);
router.get('/admin/registrations', delegateRegistrationController.getAdminRegistrations);
router.post('/admin/create-offline', upload.fields([
    { name: 'profileImage', maxCount: 1 },
    { name: 'paymentReceipt', maxCount: 1 }
]), delegateRegistrationController.createOfflineRegistration);

module.exports = router;
