const express = require("express");
const {
    getAllAnnualTurnovers,
    getAnnualTurnoverById,
    createAnnualTurnover,
    updateAnnualTurnover,
    deleteAnnualTurnover,
} = require('../../controllers/misc/AnnualTurnoverController');

const router = express.Router();

router.get("/", getAllAnnualTurnovers);
router.get("/:id", getAnnualTurnoverById);
router.post("/", createAnnualTurnover);
router.put("/:id", updateAnnualTurnover);
router.delete("/:id", deleteAnnualTurnover);

module.exports = router;
