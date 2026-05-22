const express = require('express');
const router = express.Router();
const ePromotionPackageController = require('../../controllers/e_promotion/EPromotionPackageController');

// --- Seed all ---
router.post('/packages/seed', ePromotionPackageController.seedAll);
router.post('/packages/seed-all', ePromotionPackageController.seedAll);

// --- Packages CRUD ---
router.get('/packages', ePromotionPackageController.getAllPackages);
router.post('/packages', ePromotionPackageController.createPackage);
router.put('/packages/:id', ePromotionPackageController.updatePackage);
router.delete('/packages/:id', ePromotionPackageController.deletePackage);

// --- Addons CRUD ---
router.get('/addons', ePromotionPackageController.getAllAddons);
router.post('/addons', ePromotionPackageController.createAddon);
router.put('/addons/:id', ePromotionPackageController.updateAddon);
router.delete('/addons/:id', ePromotionPackageController.deleteAddon);

// --- Reach CRUD (Single Record) ---
router.get('/reach', ePromotionPackageController.getReach);
router.put('/reach', ePromotionPackageController.updateReach);

// --- Testimonials CRUD ---
router.get('/testimonials', ePromotionPackageController.getAllTestimonials);
router.post('/testimonials', ePromotionPackageController.createTestimonial);
router.put('/testimonials/:id', ePromotionPackageController.updateTestimonial);
router.delete('/testimonials/:id', ePromotionPackageController.deleteTestimonial);

module.exports = router;
