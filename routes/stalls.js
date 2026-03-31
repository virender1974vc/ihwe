const express = require('express');
const router = express.Router();
const stallController = require('../controllers/stallController');
const { verifyToken } = require('../utils/verifyToken');
const verifyAdmin = verifyToken;

/**
 * Routes for Stall operations.
 */

// Public routes (for exhibition booking page)
router.get('/available', (req, res) => stallController.getAvailableStalls(req, res));

// Admin routes (authentication required)
router.get('/', /* verifyAdmin, */ (req, res) => stallController.getAllStalls(req, res));
router.post('/', /* verifyAdmin, */ (req, res) => stallController.addStall(req, res));
router.put('/:id', /* verifyAdmin, */ (req, res) => stallController.updateStall(req, res));
router.delete('/:id', /* verifyAdmin, */ (req, res) => stallController.deleteStall(req, res));

module.exports = router;
