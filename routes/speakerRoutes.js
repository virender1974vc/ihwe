const express = require('express');
const router = express.Router();
const speakerNominationController = require('../controllers/speakerNominationController');

/**
 * @route   POST /api/speaker-nomination
 * @desc    Submit a speaker nomination
 * @access  Public
 */
router.post('/', (req, res) => speakerNominationController.submitNomination(req, res));

/**
 * @route   GET /api/speaker-nomination
 * @desc    Get all speaker nominations
 * @access  Private (Admin)
 */
router.get('/', (req, res) => speakerNominationController.getAllNominations(req, res));

/**
 * @route   DELETE /api/speaker-nomination/:id
 * @desc    Delete a speaker nomination
 * @access  Private (Admin)
 */
router.delete('/:id', (req, res) => speakerNominationController.deleteNomination(req, res));

module.exports = router;
