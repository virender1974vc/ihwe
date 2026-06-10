const express = require("express");
const {
  loginWithPassword,
  resendOtp,
  verifyOtpLogin,
  logoutUser,
} = require('../../controllers/misc/loginController');

const router = express.Router();

router.post("/crm-login", loginWithPassword);
router.post("/resend-otp", resendOtp);
router.post("/verify-otp", verifyOtpLogin);
router.post("/logout", logoutUser);

module.exports = router;
