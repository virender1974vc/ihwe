const express = require("express");
const { getPaymentAdjustments, createPaymentAdjustment, searchReference } = require("../controllers/paymentAdjustmentController");
const { authMiddleware } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(authMiddleware);

router.get("/", getPaymentAdjustments);
router.post("/", createPaymentAdjustment);
router.get("/search-reference", searchReference);

module.exports = router;
