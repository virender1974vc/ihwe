const express = require('express');
const router = express.Router();
const reminderController = require('../controllers/reminderController');
const { authToken } = require('../middleware/authToken');
const { authMiddleware } = require('../middleware/authMiddleware');
const multer = require('multer');
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, `reminder-audio-${Date.now()}-${file.originalname}`);
    }
});
const upload = multer({ storage });
router.post('/admin/create', authMiddleware, upload.single('audioFile'), reminderController.createReminder);
router.put('/admin/edit/:id', authMiddleware, upload.single('audioFile'), reminderController.updateReminder);
router.post('/admin/resend/:id', authMiddleware, reminderController.resendReminder);
router.get('/admin/list', authMiddleware, reminderController.getAdminReminders);
router.get('/my-reminders', authToken, reminderController.getMyReminders);
router.post('/mark-read', authToken, reminderController.markAsRead);
router.post('/save-push-token', authToken, reminderController.savePushToken);

module.exports = router;
