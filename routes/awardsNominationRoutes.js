const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/awardsNominationController');

// Public
router.post('/', (req, res) => ctrl.submitNomination(req, res));
router.post('/upload', (req, res) => ctrl.uploadFile(req, res));

// Admin
router.get('/', (req, res) => ctrl.getAllNominations(req, res));
router.get('/:id', (req, res) => ctrl.getNominationById(req, res));
router.patch('/:id/status', (req, res) => ctrl.updateStatus(req, res));
router.delete('/:id', (req, res) => ctrl.deleteNomination(req, res));

module.exports = router;
