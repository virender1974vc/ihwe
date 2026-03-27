const express = require('express');
const router = express.Router();
const exhibitorProfileController = require('../controllers/exhibitorProfileController');

// GET all exhibitor profile data
router.get('/', (req, res) => exhibitorProfileController.getProfile(req, res));

// UPDATE headings and show info
router.put('/meta', (req, res) => exhibitorProfileController.updateMeta(req, res));

// ADD segment
router.post('/segments', (req, res) => exhibitorProfileController.addSegment(req, res));

// DELETE segment
router.delete('/segments/:id', (req, res) => exhibitorProfileController.deleteSegment(req, res));

// UPDATE segment
router.put('/segments/:id', (req, res) => exhibitorProfileController.updateSegment(req, res));

// ADD product category
router.post('/categories', (req, res) => exhibitorProfileController.addCategory(req, res));

// DELETE product category
router.delete('/categories/:id', (req, res) => exhibitorProfileController.deleteCategory(req, res));

// UPDATE product category
router.put('/categories/:id', (req, res) => exhibitorProfileController.updateCategory(req, res));

module.exports = router;
