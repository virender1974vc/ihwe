const CorporateVisitor = require("../../models/visitor/CorporateVisitorModel");
const GeneralVisitor = require("../../models/visitor/GeneralVisitorModel");
const VisitorOTP = require("../../models/visitor/VisitorOTPModel");
const emailService = require("../../utils/emailService");
const whatsapp = require("../../utils/whatsapp");
const jwt = require("jsonwebtoken");

// Generate 6-digit OTP
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

// ➤ SEND OTP
const sendVisitorOtp = async (req, res) => {
  const { credentials } = req.body;

  if (!credentials) {
    return res.status(400).json({ success: false, message: "Email or Mobile Number is required" });
  }

  try {
    // 1. Find Visitor (Search in Corporate first, then General)
    let visitor = await CorporateVisitor.findOne({
      $or: [{ email: credentials }, { mobile: credentials }]
    });
    let visitorType = 'corporate';

    if (!visitor) {
      visitor = await GeneralVisitor.findOne({
        $or: [{ email: credentials }, { mobile: credentials }]
      });
      visitorType = 'general';
    }

    if (!visitor) {
      return res.status(404).json({ success: false, message: "No registration found with these credentials" });
    }

    // 2. Generate OTP
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    // 3. Save OTP in DB
    await VisitorOTP.deleteMany({ credentials }); // Clear previous OTPs
    await VisitorOTP.create({
      credentials,
      otp,
      visitorId: visitor._id,
      visitorType,
      expiresAt
    });

    // 4. Send OTP via Email
    const emailSent = await emailService.sendOtpEmail(visitor.email, otp, `${visitor.firstName} ${visitor.lastName}`, 'VISITOR');
    
    // 5. Send OTP via WhatsApp
    const waSent = await whatsapp.sendWhatsAppOTP(visitor.mobile, otp, 'VISITOR');

    res.json({ 
      success: true, 
      message: "Verification code sent to your registered Email and WhatsApp",
      data: {
        toEmail: visitor.email.replace(/(.{2})(.*)(@.*)/, "$1***$3"),
        toMobile: visitor.mobile.replace(/(.{2})(.*)(.{3})/, "$1*****$3")
      }
    });

  } catch (err) {
    console.error("sendVisitorOtp Error:", err);
    res.status(500).json({ success: false, message: "Failed to send OTP. Please try again later." });
  }
};

// ➤ VERIFY OTP
const verifyVisitorOtp = async (req, res) => {
  const { credentials, otp } = req.body;

  if (!credentials || !otp) {
    return res.status(400).json({ success: false, message: "Credentials and OTP are required" });
  }

  try {
    const otpRecord = await VisitorOTP.findOne({ credentials, otp });

    if (!otpRecord) {
      return res.status(400).json({ success: false, message: "Invalid or expired OTP" });
    }

    // OTP validated - Fetch full visitor data
    let visitor;
    if (otpRecord.visitorType === 'corporate') {
      visitor = await CorporateVisitor.findById(otpRecord.visitorId);
    } else {
      visitor = await GeneralVisitor.findById(otpRecord.visitorId);
    }

    if (!visitor) {
        return res.status(404).json({ success: false, message: "Visitor record no longer exists" });
    }

    // Clear OTP after successful verification
    await VisitorOTP.deleteOne({ _id: otpRecord._id });

    // Generate Temporary JWT for Badge Access
    const token = jwt.sign(
      { id: visitor._id, type: otpRecord.visitorType },
      process.env.JWT_SECRET || 'ihwe_secret_2026',
      { expiresIn: '1h' }
    );

    res.json({
      success: true,
      message: "Authentication successful",
      token,
      visitor: {
        registrationId: visitor.registrationId,
        firstName: visitor.firstName,
        lastName: visitor.lastName,
        designation: visitor.designation || 'Visitor',
        companyName: visitor.companyName || 'N/A',
        country: visitor.country || 'India',
        visitorType: otpRecord.visitorType === 'corporate' ? 'Corporate Visitor' : 'General Visitor'
      }
    });

  } catch (err) {
    console.error("verifyVisitorOtp Error:", err);
    res.status(500).json({ success: false, message: "Authentication failed" });
  }
};

module.exports = {
  sendVisitorOtp,
  verifyVisitorOtp
};
