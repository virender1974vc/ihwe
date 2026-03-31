const express = require("express");
const router = express.Router();
const vacancyController = require("../controllers/vacancyController");

router.get("/", vacancyController.getVacancies);
router.post("/", vacancyController.createVacancy);
router.put("/:id", vacancyController.updateVacancy);
router.delete("/:id", vacancyController.deleteVacancy);
router.patch("/:id/status", vacancyController.updateStatus);
router.post("/bulk-delete", vacancyController.bulkDelete);

module.exports = router;
