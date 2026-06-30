const express = require('express');
const router = express.Router();
const delegateRegistrationController = require('../controllers/delegateRegistrationController');

router.post('/register', delegateRegistrationController.createRegistration);
router.post('/verify', delegateRegistrationController.verifyPayment);

module.exports = router;
