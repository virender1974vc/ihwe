const nodemailer = require("nodemailer");
const { secondaryDB } = require("../config/secondaryDb");
const EmailLog = require("../models/EmailLog");
const { resolveEventIdForCompany } = require("../utils/whatsapp");

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
    const { to, subject, content, companyName, sentBy, senderId, senderName, cmpny_id } = req.body;

    if (!to || !subject || !content) {
      return res.status(400).json({ success: false, message: "to, subject and content are required" });
    }

    const uploadedAttachments = (req.files || []).map((file) => ({
      filename: file.originalname,
      content: file.buffer,
    }));

    let existingAttachments = [];
    if (req.body.existingAttachments) {
      try {
        existingAttachments = JSON.parse(req.body.existingAttachments);
      } catch (e) {
        console.error("Failed to parse existingAttachments:", e);
      }
    }

    const attachments = [...uploadedAttachments, ...existingAttachments];

    const mailOptions = {
      from: `"${process.env.FROM_NAME || "IHWE CRM"}" <${process.env.FROM_EMAIL || process.env.SMTP_USER}>`,
      to,
      replyTo: process.env.FROM_EMAIL || process.env.SMTP_USER,
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

    const info = await transporter.sendMail(mailOptions);
    const messageId = info.messageId;
    if (cmpny_id && messageId) {
      try {
        const CrmReview = secondaryDB.model("CrmExhibatorReview2023");
        await CrmReview.create({
          cmpny_id,
          type: "email",
          re_msg: content,
          email_subject: subject,
          email_content: content,
          message_id: messageId,
          forward_to: to,
        });
      } catch (e) {
        console.error("[CRM Email] Failed to save log:", e.message);
      }
    }

    try {
      const eventId = await resolveEventIdForCompany(cmpny_id);
      await EmailLog.create({
        recipient: to,
        subject: subject,
        message: content,
        status: "success",
        senderId: senderId || null,
        senderName: senderName || sentBy || null,
        companyId: cmpny_id || null,
        companyName: companyName || null,
        eventId
      });
    } catch (e) {
      console.error("[CRM Email] Failed to save EmailLog:", e.message);
    }

    res.status(200).json({ success: true, message: "Email sent successfully", messageId });
  } catch (err) {
    console.error("[CRM Email]", err.message);
    res.status(500).json({ success: false, message: err.message || "Failed to send email" });
  }
};

module.exports = { sendCrmEmail };
