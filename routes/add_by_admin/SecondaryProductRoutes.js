const express = require("express");
const router = express.Router();
const { getAllSecondaryProducts, getSecondaryProductById, createSecondaryProduct, updateSecondaryProduct, deleteSecondaryProduct } = require("../../controllers/add_by_admin/SecondaryProductController");

router.get("/", getAllSecondaryProducts);
router.get("/:id", getSecondaryProductById);
router.post("/", createSecondaryProduct);
router.put("/:id", updateSecondaryProduct);
router.delete("/:id", deleteSecondaryProduct);

module.exports = router;
