const MarketingMaterial = require('../../models/cms/MarketingMaterial');
const MarketingShareLog = require('../../models/cms/MarketingShareLog');
const EmailLog = require('../../models/crm/EmailLog');
const nodemailer = require("nodemailer");
const { sendWhatsappMessage } = require('../crm/commonWhatsappController');
const axios = require("axios");

const getAdminName = (req) => req.user?.username || req.user?.name || req.body.updatedBy || req.body.createdBy || "Admin";

const parseBoolean = (value, fallback) => {
  if (value === undefined) return fallback;
  if (value === true || value === "true") return true;
  if (value === false || value === "false") return false;
  return fallback;
};

// Setup Nodemailer
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: parseInt(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

exports.getAllMaterials = async (req, res) => {
  try {
    const { includeInactive } = req.query;
    const query = includeInactive === "true" ? {} : { isActive: true };
    const materials = await MarketingMaterial.find(query).sort({ createdAt: -1 });

    // Group by category for frontend convenience
    const grouped = materials.reduce((acc, curr) => {
      if (!acc[curr.category]) acc[curr.category] = [];
      acc[curr.category].push(curr);
      return acc;
    }, {});

    res.json({ success: true, data: grouped, flatData: materials });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.createMaterial = async (req, res) => {
  try {
    const { category, title, fileType, fileUrl, fileSize, totalPages, isActive } = req.body;
    let finalFileUrl = fileUrl;
    const adminName = getAdminName(req);

    if (req.file) {
      if (req.file.mimetype.includes("image") || req.file.mimetype.includes("video")) {
        const cloudinary = require("cloudinary").v2;
        const result = await cloudinary.uploader.upload(req.file.path, { resource_type: "auto", folder: "marketing-materials" });
        finalFileUrl = result.secure_url;
        require('fs').unlinkSync(req.file.path);
      } else {
        finalFileUrl = req.protocol + '://' + req.get('host') + '/' + req.file.path.replace(/\\/g, '/');
      }
    }

    if (!finalFileUrl) {
      return res.status(400).json({ success: false, message: "File or File URL is required" });
    }

    const material = await MarketingMaterial.create({
      category,
      title,
      fileType,
      fileUrl: finalFileUrl,
      fileSize: fileSize || (req.file ? (req.file.size / (1024 * 1024)).toFixed(2) + " MB" : ""),
      totalPages,
      isActive: parseBoolean(isActive, true),
      createdBy: adminName,
      updatedBy: adminName,
    });

    res.status(201).json({ success: true, data: material });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateMaterial = async (req, res) => {
  try {
    const { id } = req.params;
    const { category, title, fileType, fileUrl, fileSize, totalPages, isActive } = req.body;
    let finalFileUrl = fileUrl;
    const adminName = getAdminName(req);

    if (req.file) {
      if (req.file.mimetype.includes("image") || req.file.mimetype.includes("video")) {
        const cloudinary = require("cloudinary").v2;
        const result = await cloudinary.uploader.upload(req.file.path, { resource_type: "auto", folder: "marketing-materials" });
        finalFileUrl = result.secure_url;
        require('fs').unlinkSync(req.file.path);
      } else {
        finalFileUrl = req.protocol + '://' + req.get('host') + '/' + req.file.path.replace(/\\/g, '/');
      }
    }

    const updateData = {
      ...(category !== undefined && { category }),
      ...(title !== undefined && { title }),
      ...(fileType !== undefined && { fileType }),
      ...(totalPages !== undefined && { totalPages }),
      ...(isActive !== undefined && { isActive: parseBoolean(isActive, true) }),
      updatedBy: adminName,
    };
    if (finalFileUrl) updateData.fileUrl = finalFileUrl;
    if (fileSize || req.file) updateData.fileSize = fileSize || (req.file.size / (1024 * 1024)).toFixed(2) + " MB";

    const material = await MarketingMaterial.findByIdAndUpdate(id, updateData, { returnDocument: 'after' });
    if (!material) return res.status(404).json({ success: false, message: "Material not found" });

    res.json({ success: true, data: material });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.deleteMaterial = async (req, res) => {
  try {
    const material = await MarketingMaterial.findByIdAndDelete(req.params.id);
    if (!material) return res.status(404).json({ success: false, message: "Material not found" });
    // Note: We might want to delete from Cloudinary here as well if needed.
    res.json({ success: true, message: "Material deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.shareMaterials = async (req, res) => {
  try {
    let { cmpny_id, material_ids, sentVia, sentBy, senderId, senderName, clientMobile, clientEmail, clientName } = req.body;

    if (!material_ids || !Array.isArray(material_ids) || material_ids.length === 0) {
      return res.status(400).json({ success: false, message: "No materials selected" });
    }

    const materials = await MarketingMaterial.find({ _id: { $in: material_ids } });

    // --- VALIDATION LIMITS ---
    let counts = { Video: 0, Image: 0, PDF: 0, Word: 0, PPT: 0 };
    materials.forEach(m => {
      if (counts[m.fileType] !== undefined) counts[m.fileType]++;
    });

    if (sentVia === "WhatsApp") {
      if (counts.Video > 1) return res.status(400).json({ success: false, message: "You can only send 1 Video at a time on WhatsApp." });
      if (counts.Image > 1) return res.status(400).json({ success: false, message: "You can only send 1 Image at a time on WhatsApp." });
      if (counts.PDF > 1) return res.status(400).json({ success: false, message: "You can only send 1 PDF at a time on WhatsApp." });
      if (counts.Word > 1) return res.status(400).json({ success: false, message: "You can only send 1 Word document at a time on WhatsApp." });
      if (counts.PPT > 1) return res.status(400).json({ success: false, message: "You can only send 1 PPT at a time on WhatsApp." });
    } else if (sentVia === "Email") {
      if (counts.Video > 1) return res.status(400).json({ success: false, message: "You can only send 1 Video at a time via Email." });
      if (counts.Image > 3) return res.status(400).json({ success: false, message: "You can only send up to 3 Images at a time via Email." });
      if (counts.PDF > 2) return res.status(400).json({ success: false, message: "You can only send up to 2 PDFs at a time via Email." });
      if (counts.Word > 2) return res.status(400).json({ success: false, message: "You can only send up to 2 Word documents at a time via Email." });
      if (counts.PPT > 2) return res.status(400).json({ success: false, message: "You can only send up to 2 PPTs at a time via Email." });
    }
    // -------------------------

    let clientNameVar = clientName;
    let clientEmailVar = clientEmail;
    let clientMobileVar = clientMobile;

    if (!clientMobileVar || !clientEmailVar || !clientNameVar) {
      const Company = require('../../models/misc/Company');
      const company = await Company.findById(cmpny_id);
      if (company) {
        if (!clientNameVar) clientNameVar = company.companyName;
        if (!clientEmailVar) clientEmailVar = company.email || (company.contacts?.length > 0 ? company.contacts[0].email : "");
        if (!clientMobileVar) clientMobileVar = company.contacts?.length > 0 ? company.contacts[0].mobile : "";
      }
    }

    let hasAttachedMedia = materials.some(m => 
      ["Image", "Video", "PDF"].includes(m.fileType) && 
      !m.fileUrl.includes("youtube.com") && 
      !m.fileUrl.includes("youtu.be") &&
      !m.fileUrl.includes("localhost") && 
      !m.fileUrl.includes("127.0.0.1")
    );
    
    let contentMessage = `IHWE Namaskar!\n\nDear ${clientNameVar || "Sir/Ma'am"},\n\nPlease find the requested marketing materials${hasAttachedMedia ? " attached" : ""}:\n\n`;
    
    let textItems = [];
    
    materials.forEach((m) => {
      let icon = "📄";
      let isMediaOnly = false; // Files that Opus API can send as direct attachments

      if (m.fileType === "Video") {
        icon = "🎥";
        if (!m.fileUrl.includes("youtube.com") && !m.fileUrl.includes("youtu.be")) {
          isMediaOnly = true;
        }
      }
      else if (m.fileType === "Image") { 
        icon = "🖼️"; 
        isMediaOnly = true; 
      }
      else if (m.fileType === "PDF") { 
        icon = "📕"; 
        // Opus API supports PDF attachment, but only if it's a live public URL
        if (!m.fileUrl.includes("localhost") && !m.fileUrl.includes("127.0.0.1")) {
          isMediaOnly = true;
        }
      }
      else if (m.fileType === "PPT") { icon = "📊"; }
      else if (m.fileType === "Word") { icon = "📝"; }
      else if (m.fileType === "Location") { icon = "📍"; }
      else if (m.fileType === "Link") { icon = "🔗"; }

      if (!isMediaOnly) {
        textItems.push(`${icon} *${m.title}*\n${m.fileUrl}`);
      }
    });
    
    if (textItems.length > 0) {
      contentMessage += textItems.join("\n\n") + "\n\n";
    }

    contentMessage += `For any queries, feel free to contact us.\n\nBest Regards,\n*IHWE Team*\nNamo Gange Wellness Pvt. Ltd.`;

    // Send logic
    if (sentVia === "Email" && !req.body.logOnly) {
      if (!clientEmailVar) return res.status(400).json({ success: false, message: "Client email is required" });

      const emailHtmlContent = `<ul>${materials.map(m => `<li><strong>${m.title}:</strong> <a href="${m.fileUrl}">View/Download</a></li>`).join("")}</ul>`;
      const mailOptions = {
        from: `"${process.env.FROM_NAME || "IHWE CRM"}" <${process.env.FROM_EMAIL || process.env.SMTP_USER}>`,
        to: clientEmailVar,
        replyTo: process.env.FROM_EMAIL || process.env.SMTP_USER,
        subject: "Marketing Materials from IHWE",
        html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
            <p>Namaskar,</p>
            <p>Dear ${clientNameVar || "Sir/Ma'am"},</p>
            <p>Please find the requested marketing materials below:</p>
            
            ${emailHtmlContent}
            
            <p>For any queries, feel free to contact us.</p>
            <br/>
            <p>Best Regards,</p>
            <p><strong>IHWE Team</strong></p>
            <p>Namo Gange Wellness Pvt. Ltd.</p>
        </div>
        `
      };
      await transporter.sendMail(mailOptions);
      try {
        await EmailLog.create({
          recipient: clientEmailVar,
          subject: "Marketing Materials from IHWE",
          message: emailHtmlContent,
          status: "success",
          senderId: senderId || null,
          senderName: senderName || sentBy || null,
          companyId: cmpny_id || null,
          companyName: clientNameVar || null
        });
      } catch (err) {
        console.error("EmailLog (Marketing Material) failed:", err.message);
      }

    } else if (sentVia === "WhatsApp") {
      if (!clientMobileVar) return res.status(400).json({ success: false, message: "Client mobile is required" });

      const whatsapp = require('../../utils/whatsapp');
      try {
        await whatsapp.sendWhatsAppRichMessage(clientMobileVar, contentMessage, materials, "Marketing Materials Share", {
          senderId,
          senderName,
          companyId: cmpny_id,
          companyName: clientNameVar
        });
      } catch (waErr) {
        console.error("WhatsApp sending error:", waErr.message);
      }
    }

    // Create Log
    const log = await MarketingShareLog.create({
      cmpny_id,
      materials: materials.map((m) => ({ material_id: m._id, title: m.title, category: m.category })),
      sentVia,
      sentBy: sentBy || "Admin",
      status: "Sent",
    });

    res.json({ success: true, message: `Materials shared via ${sentVia}`, data: log });
  } catch (err) {
    console.error("Share Error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getShareHistory = async (req, res) => {
  try {
    const { cmpny_id } = req.params;
    const history = await MarketingShareLog.find({ cmpny_id }).sort({ createdAt: -1 });
    res.json({ success: true, data: history });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
