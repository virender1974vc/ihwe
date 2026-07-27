const express = require("express");
const { createNextAction, getNextActions, getNextActionById, updateNextAction, deleteNextAction } = require("../../controllers/add_by_admin/nextActionController");

const router = express.Router();

router.post("/", createNextAction);
router.get("/", getNextActions);
router.get("/:id", getNextActionById);
router.put("/:id", updateNextAction);
router.delete("/:id", deleteNextAction);

module.exports = router;
