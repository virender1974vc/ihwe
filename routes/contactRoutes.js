const express = require('express');
const router = express.Router();
const contactController = require('../controllers/contactController');

router.get('/', contactController.getAllContacts);
router.delete('/:id', contactController.deleteContact);
router.post('/bulk-delete', contactController.bulkDeleteContacts);
router.patch('/:id/status', contactController.updateStatus);
router.post('/bulk-update-status', contactController.bulkUpdateStatus);

module.exports = router;
