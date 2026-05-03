const express = require("express");
const router = express.Router();
const {
  getAgendas,
  createAgenda,
  updateAgenda,
  deleteAgenda,
  bulkUpdateAgenda
} = require("../controllers/agendaController");

// Public routes
router.get("/", getAgendas);

// Protected routes (Admin only - middleware should be added here later)
router.post("/", createAgenda);
router.put("/bulk", bulkUpdateAgenda);
router.put("/:id", updateAgenda);
router.delete("/:id", deleteAgenda);

module.exports = router;
