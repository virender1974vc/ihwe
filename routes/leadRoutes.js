const express = require("express");
const router = express.Router();
const leadController = require("../controllers/leadController");

router.get("/individual", leadController.getIndividualLeads);
router.post("/individual", leadController.createIndividualLead);
router.put("/individual/:id", leadController.updateIndividualLead);
router.delete("/individual/:id", leadController.deleteIndividualLead);

router.get("/corporate", leadController.getCorporateLeads);
router.post("/corporate", leadController.createCorporateLead);
router.put("/corporate/:id", leadController.updateCorporateLead);
router.delete("/corporate/:id", leadController.deleteCorporateLead);

module.exports = router;
