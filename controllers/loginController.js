const jwt = require("jsonwebtoken");
const CrmUser = require("../models/CrmUser");
const generateToken = require("../utils/generateToken");
const { generateOtp, sendOtpWhatsapp } = require("../utils/otpService");

const JWT_SECRET = process.env.JWT_SECRET || "your_secret_key";

// ============================
// LOGIN WITH PASSWORD (OTP)
// ============================
const loginWithPassword = async (req, res) => {
  try {
    const { user_name, user_mobile, user_password } = req.body;

    if (!user_password || (!user_name && !user_mobile)) {
      return res.status(400).json({
        message: "Username or Mobile and Password required",
      });
    }

    const user = await CrmUser.findOne({
      $or: [{ user_name }, { user_mobile }],
      user_status: "Active",
    });

    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const isMatch = await user.comparePassword(user_password);

    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const otp = generateOtp();

    user.otp = otp;
    user.otp_expires_at = new Date(Date.now() + 1 * 60 * 1000);
    await user.save();

    try {
      await sendOtpWhatsapp(user.user_mobile, otp);
    } catch (error) {
      console.error("OTP WhatsApp send failed:", error.message);
    }

    res.json({
      success: true,
      message: "OTP sent successfully",
      user_id: user._id,
      username: user.user_name,
    });
  } catch (err) {
    console.error("LOGIN OTP ERROR:", err);
    res.status(500).json({ message: "OTP sending failed" });
  }
};

// ============================
// RESEND OTP
// ============================
const resendOtp = async (req, res) => {
  try {
    const { user_id } = req.body;

    const user = await CrmUser.findById(user_id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const otp = generateOtp();

    user.otp = otp;
    user.otp_expires_at = new Date(Date.now() + 5 * 60 * 1000);
    await user.save();

    try {
      await sendOtpWhatsapp(user.user_mobile, otp);
    } catch (error) {
      console.error("OTP WhatsApp send failed:", error.message);
    }

    res.json({
      success: true,
      message: "OTP resent successfully",
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to resend OTP" });
  }
};

// ============================
// VERIFY OTP
// ============================
const verifyOtpLogin = async (req, res) => {
  try {
    const { user_id, otp } = req.body;

    const user = await CrmUser.findById(user_id);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (
      user.otp !== String(otp) ||
      !user.otp_expires_at ||
      user.otp_expires_at < new Date()
    ) {
      return res.status(400).json({
        message: "Invalid or expired OTP",
      });
    }

    // clear otp
    user.otp = null;
    user.otp_expires_at = null;
    user.user_last_login = new Date();
    await user.save();

    const token = generateToken(user);

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        username: user.user_name,
        email: user.user_email,
        role: user.user_role,
        mobile: user.user_mobile,
      },
    });
  } catch (err) {
    res.status(500).json({ message: "OTP verification failed" });
  }
};

// ============================
// LOGOUT (FIXED)
// ============================
const logoutUser = (req, res) => {
  try {
    // ❌ Wrong: res.json({ token });

    // ✅ Correct: token clear / client side handle
    res.status(200).json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    console.error("Logout Error:", error);
    res.status(500).json({
      message: "Server error during logout",
    });
  }
};

// ============================
// EXPORT
// ============================
module.exports = {
  loginWithPassword,
  resendOtp,
  verifyOtpLogin,
  logoutUser,
};
