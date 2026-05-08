const express = require('express');
const router = express.Router();
const ePromotionPackageController = require('../../controllers/e_promotion/EPromotionPackageController');

// Get all packages
router.get('/packages', ePromotionPackageController.getAllPackages);

// Seed packages (useful for initial setup)
router.post('/packages/seed', ePromotionPackageController.seedPackages);

// CRUD operations
router.post('/packages', ePromotionPackageController.createPackage);
router.put('/packages/:id', ePromotionPackageController.updatePackage);
router.delete('/packages/:id', ePromotionPackageController.deletePackage);

module.exports = router;
