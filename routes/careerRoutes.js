const express = require("express");
const router = express.Router();
const careerController = require("../controllers/careerController");

router.get("/", careerController.getApplications);
router.post("/", careerController.createApplication);
router.patch("/:id/status", careerController.updateStatus);
router.delete("/:id", careerController.deleteApplication);
router.post("/bulk-delete", careerController.bulkDelete);

module.exports = router;
