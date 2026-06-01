const express = require('express');
const router = express.Router();
const designationController = require('../controllers/designationController');

router.get('/', (req, res) => designationController.getAllDesignations(req, res));
router.post('/create', (req, res) => designationController.createDesignation(req, res));
router.put('/update/:id', (req, res) => designationController.updateDesignation(req, res));
router.delete('/delete/:id', (req, res) => designationController.deleteDesignation(req, res));

module.exports = router;
