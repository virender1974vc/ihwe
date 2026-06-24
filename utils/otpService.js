const axios = require("axios");
const aisensy = require("./aisensyService");

// OTP generate - 4 digit OTP
const generateOtp = () => Math.floor(1000 + Math.random() * 9000).toString();

// Send OTP on WhatsApp/SMS
const sendOtpWhatsapp = async (mobile, otp) => {
  const aisensyResult = await aisensy.sendTemplate({
    campaignEnvKey: "AISENSY_CAMPAIGN_OTP",
    phone: mobile,
    templateParams: [otp],
    buttonValue: otp
  });
  if (aisensyResult.success) return aisensyResult;
  if (!aisensyResult.skipped) {
    console.warn(`[otpService] AiSensy OTP attempt failed, falling back to Opus: ${aisensyResult.error || aisensyResult.reason}`);
  }

  const msg = `Your Health & Wellness Expo login OTP is ${otp}. Valid for 1 minute.`;

  const url = `http://api.opustechnology.in/wapp/v2/api/send?apikey=${process.env.OPUS_API_KEY
    }&mobile=${mobile}&msg=${encodeURIComponent(msg)}`;

  await axios.get(url);
};

module.exports = { generateOtp, sendOtpWhatsapp };
