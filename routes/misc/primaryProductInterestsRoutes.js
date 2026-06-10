const express = require("express");
const router = express.Router();
const { getAllPrimaryProductInterests, getPrimaryProductInterestById, createPrimaryProductInterest, updatePrimaryProductInterest, deletePrimaryProductInterest } = require('../../controllers/misc/PrimaryProductInterestController');

router.get("/", getAllPrimaryProductInterests);
router.get("/:id", getPrimaryProductInterestById);
router.post("/", createPrimaryProductInterest);
router.put("/:id", updatePrimaryProductInterest);
router.delete("/:id", deletePrimaryProductInterest);

module.exports = router;
