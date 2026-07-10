const express = require("express");
const {
  createExhibitionRole,
  getExhibitionRoles,
  getExhibitionRoleById,
  updateExhibitionRole,
  deleteExhibitionRole,
} = require("../../controllers/add_by_admin/exhibitionRoleController");

const router = express.Router();

router.post("/", createExhibitionRole);
router.get("/", getExhibitionRoles);
router.get("/:id", getExhibitionRoleById);
router.put("/:id", updateExhibitionRole);
router.delete("/:id", deleteExhibitionRole);

module.exports = router;
