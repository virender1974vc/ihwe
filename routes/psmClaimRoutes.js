const express = require('express');
const router = express.Router();
const psmClaimController = require('../controllers/psmClaimController');
const { protectExhibitor } = require('../middleware/auth');

// All psm claim routes protected by exhibitor login
router.get('/reports', protectExhibitor, psmClaimController.getAllReports);
router.post('/reports/:type', protectExhibitor, psmClaimController.saveReport);
router.get('/reports/:type/:id', protectExhibitor, psmClaimController.getReportById);
router.delete('/reports/:type/:id', protectExhibitor, psmClaimController.deleteReport);

module.exports = router;
