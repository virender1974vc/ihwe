const express = require('express');
const router = express.Router();
const exhibitorRegistrationController = require('../controllers/exhibitorRegistrationController');

// Admin side manual registration and list
router.get('/', exhibitorRegistrationController.getAllRegistrations);
router.post('/', exhibitorRegistrationController.addRegistration);
router.put('/:id', exhibitorRegistrationController.updateRegistration);
router.delete('/:id', exhibitorRegistrationController.deleteRegistration);

module.exports = router;
