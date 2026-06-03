const express = require('express');
const router = express.Router();
const documentRequirementController = require('../../controllers/add_by_admin/documentRequirementController');

router.get('/', documentRequirementController.getAllDocumentRequirements);
router.get('/:id', documentRequirementController.getDocumentRequirementById);
router.post('/', documentRequirementController.createDocumentRequirement);
router.put('/:id', documentRequirementController.updateDocumentRequirement);
router.delete('/:id', documentRequirementController.deleteDocumentRequirement);

module.exports = router;
