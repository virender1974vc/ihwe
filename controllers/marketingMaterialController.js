const MarketingMaterial = require("../models/MarketingMaterial");
const MarketingShareLog = require("../models/MarketingShareLog");
const nodemailer = require("nodemailer");
const { sendWhatsappMessage } = require("./commonWhatsappController");
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

    const material = await MarketingMaterial.findByIdAndUpdate(id, updateData, { new: true });
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
    const { cmpny_id, material_ids, sentVia, sentBy, clientEmail, clientMobile, clientName } = req.body;

    if (!material_ids || !material_ids.length) {
      return res.status(400).json({ success: false, message: "No materials selected" });
    }

    const materials = await MarketingMaterial.find({ _id: { $in: material_ids } });

    let contentMessage = `Dear ${clientName || "Sir/Ma'am"},\n\nPlease find the requested marketing materials below:\n`;
    materials.forEach((m) => {
      contentMessage += `- ${m.title}: ${m.fileUrl}\n`;
    });
    contentMessage += `\nBest Regards,\nIHWE Team`;

    // Send logic
    if (sentVia === "Email" && !req.body.logOnly) {
      if (!clientEmail) return res.status(400).json({ success: false, message: "Client email is required" });

      const mailOptions = {
        from: `"${process.env.FROM_NAME || "IHWE CRM"}" <${process.env.FROM_EMAIL || process.env.SMTP_USER}>`,
        to: clientEmail,
        replyTo: process.env.FROM_EMAIL || process.env.SMTP_USER,
        subject: "Marketing Materials from IHWE",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: #1a3516; padding: 20px; text-align: center;">
              <h2 style="color: white; margin: 0;">IHWE 2026 Marketing Materials</h2>
            </div>
            <div style="padding: 24px; background: #f9f9f9; line-height: 1.6;">
              <p>Dear ${clientName || "Sir/Ma'am"},</p>
              <p>Please find the requested marketing materials below:</p>
              <ul>
                ${materials.map(m => `<li><strong>${m.title}:</strong> <a href="${m.fileUrl}">View/Download</a></li>`).join("")}
              </ul>
              <p>Best Regards,<br/>IHWE Team</p>
            </div>
          </div>
        `,
      };
      await transporter.sendMail(mailOptions);

    } else if (sentVia === "WhatsApp") {
      if (!clientMobile) return res.status(400).json({ success: false, message: "Client mobile is required" });

      // Sending Whatsapp via Opus
      const opusUrl = process.env.WHATSAPP_API_URL || "https://api.opus.in/send";
      const opusToken = process.env.WHATSAPP_API_TOKEN || "test_token";

      try {
        await axios.post(opusUrl, {
          phone: clientMobile,
          message: contentMessage,
          token: opusToken
        });
      } catch (waErr) {
        console.error("WhatsApp sending error:", waErr.message);
        // Continue to log even if it fails, or throw error depending on requirements.
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
