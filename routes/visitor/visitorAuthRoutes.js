const express = require("express");
const { sendVisitorOtp, verifyVisitorOtp } = require("../../controllers/visitor/visitorAuthController");

const router = express.Router();

router.post("/send-otp", sendVisitorOtp);
router.post("/verify-otp", verifyVisitorOtp);

module.exports = router;
