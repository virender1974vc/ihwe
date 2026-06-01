const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: parseInt(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const sendCrmEmail = async (req, res) => {
  try {
    const { to, subject, content, companyName, sentBy } = req.body;

    if (!to || !subject || !content) {
      return res.status(400).json({ success: false, message: "to, subject and content are required" });
    }

    // Build attachments array from uploaded files
    const attachments = (req.files || []).map((file) => ({
      filename: file.originalname,
      content: file.buffer,
    }));

    const mailOptions = {
      from: `"${process.env.FROM_NAME || "IHWE CRM"}" <${process.env.FROM_EMAIL || process.env.SMTP_USER}>`,
      to,
      subject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #1a3516; padding: 20px; text-align: center;">
            <h2 style="color: white; margin: 0;">IHWE 2026</h2>
          </div>
          <div style="padding: 24px; background: #f9f9f9;">
            ${content.replace(/\n/g, "<br/>")}
          </div>
          <div style="padding: 12px; background: #eee; text-align: center; font-size: 11px; color: #666;">
            Sent via IHWE CRM${sentBy ? ` by ${sentBy}` : ""}${companyName ? ` | Regarding: ${companyName}` : ""}
          </div>
        </div>
      `,
      attachments,
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({ success: true, message: "Email sent successfully" });
  } catch (err) {
    console.error("[CRM Email]", err.message);
    res.status(500).json({ success: false, message: err.message || "Failed to send email" });
  }
};

module.exports = { sendCrmEmail };
