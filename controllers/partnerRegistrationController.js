const PartnerRegistration = require("../models/PartnerRegistration");
const emailService = require("../utils/emailService");
const whatsapp = require("../utils/whatsapp");
const { logActivity } = require("../utils/logger");

class PartnerRegistrationController {
  /**
   * Submit a new partner registration
   */
  async submitRegistration(req, res) {
    try {
      const registrationData = { ...req.body };

      // Parse JSON fields if they are sent as strings (e.g. from FormData)
      if (typeof registrationData.selectedServices === "string") {
        try {
          registrationData.selectedServices = JSON.parse(registrationData.selectedServices);
        } catch (e) {
          registrationData.selectedServices = registrationData.selectedServices
            ? registrationData.selectedServices.split(",").map((s) => s.trim())
            : [];
        }
      }
      if (typeof registrationData.partnershipInterests === "string") {
        try {
          registrationData.partnershipInterests = JSON.parse(registrationData.partnershipInterests);
        } catch (e) {
          registrationData.partnershipInterests = registrationData.partnershipInterests
            ? registrationData.partnershipInterests.split(",").map((s) => s.trim())
            : [];
        }
      }

      // Convert declaration to boolean
      if (registrationData.declaration === "true") {
        registrationData.declaration = true;
      } else if (registrationData.declaration === "false") {
        registrationData.declaration = false;
      }

      // Basic validation
      const requiredFields = [
        "companyName",
        "businessCategory",
        "fullName",
        "designation",
        "mobile",
        "email",
        "officeAddress",
        "city",
        "state",
        "country",
        "pinCode",
        "experience",
      ];

      for (const field of requiredFields) {
        if (!registrationData[field]) {
          return res.status(400).json({ success: false, message: `Field ${field} is required` });
        }
      }

      // Create model instance
      const partner = new PartnerRegistration(registrationData);

      // Handle file uploads (mapped by Multer)
      if (req.files) {
        const fileFields = [
          "companyProfile",
          "gstCertificate",
          "panCard",
          "msmeCertificate",
          "portfolio",
          "visitingCard",
        ];

        fileFields.forEach((field) => {
          if (req.files[field] && req.files[field][0]) {
            partner[`${field}Path`] = `/uploads/partners/documents/${req.files[field][0].filename}`;
          }
        });
      }

      // Mark OTPs as verified if they successfully went through frontend verification
      // (as simulated in the frontend code)
      partner.otpVerifiedEmail = true;
      partner.otpVerifiedMobile = true;

      await partner.save();

      // Log activity
      try {
        await logActivity(
          req,
          "Created",
          "Partner Registration",
          `New Partner registration for: ${partner.companyName} by ${partner.fullName}`
        );
      } catch (err) {
        console.error("Logger error:", err);
      }

      // Send Confirmations
      try {
        await this.sendConfirmations(partner);
      } catch (err) {
        console.error("Error sending partner confirmations:", err);
      }

      res.status(201).json({
        success: true,
        message: "Partner registration submitted successfully",
        data: partner,
      });
    } catch (error) {
      console.error("Error in submitRegistration:", error);
      res.status(500).json({ success: false, message: error.message || "Internal Server Error" });
    }
  }

  /**
   * Send confirmation Email and WhatsApp messages
   */
  async sendConfirmations(partner) {
    const emailData = {
      fullName: partner.fullName,
      companyName: partner.companyName,
      registrationId: partner.registrationId,
    };

    // Send Email to Partner
    await emailService.sendEmail({
      to: partner.email,
      subject: `Service Partner Registration Received | IHWE 2026 | ${partner.registrationId}`,
      html: this.getEmailTemplate(emailData),
      profile: "DEFAULT",
    });

    // Send WhatsApp to Partner
    const whatsappMsg = `Namo Gange Namaskar!\n\nDear ${partner.fullName},\n\nThank you for registering as an Official Service Partner for the *9th International Health & Wellness Expo 2026 (IHWE)* on behalf of *${partner.companyName}*.\n\n*Registration ID:* ${partner.registrationId}\n\nOur team will review your application details and get in touch with you soon.\n\nBest Regards,\nTeam IHWE\nNamo Gange Wellness Pvt. Ltd.`;

    await whatsapp.sendWhatsAppMessage(partner.mobile, whatsappMsg, "Partner Registration Confirmation");
  }

  getEmailTemplate(data) {
    return `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #333; line-height: 1.6; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 10px; overflow: hidden;">
        <div style="background-color: #1a5c2a; padding: 20px; text-align: center; color: white;">
            <h1 style="margin: 0; font-size: 24px;">Official Partner Registration</h1>
            <p style="margin: 5px 0 0; opacity: 0.8;">International Health & Wellness Expo 2026</p>
        </div>
        <div style="padding: 30px;">
            <p>Dear <strong>${data.fullName}</strong>,</p>
            <p>Namo Gange Namaskar!</p>
            <p>Thank you for registering as an Official Service Partner for the <strong>9th International Health & Wellness Expo 2026 (IHWE)</strong>.</p>
            
            <div style="background-color: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #1a5c2a;">
                <p style="margin: 0;"><strong>Registration ID:</strong> ${data.registrationId}</p>
                <p style="margin: 5px 0 0;"><strong>Company Name:</strong> ${data.companyName}</p>
            </div>

            <p>We have successfully received your registration details. Our review committee will evaluate your application and get in touch with you shortly to discuss potential collaboration opportunities.</p>
            
            <p>Should you have any questions in the meantime, please feel free to contact us at <a href="mailto:info@ihwe.in" style="color: #1a5c2a; text-decoration: none; font-weight: bold;">info@ihwe.in</a>.</p>
            
            <p style="margin-top: 30px;">Best Regards,</p>
            <p><strong>Team IHWE 2026</strong><br>Namo Gange Wellness Pvt. Ltd.</p>
        </div>
        <div style="background-color: #f4f4f4; padding: 15px; text-align: center; font-size: 12px; color: #777;">
            <p style="margin: 0;">&copy; 2026 IHWE. All Rights Reserved.</p>
        </div>
    </div>
    `;
  }

  /**
   * Get all partner registrations (for admin)
   */
  async getAllRegistrations(req, res) {
    try {
      const partners = await PartnerRegistration.find().sort({ createdAt: -1 });
      res.json({ success: true, data: partners });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  /**
   * Get partner registration by ID (for admin)
   */
  async getRegistrationById(req, res) {
    try {
      const partner = await PartnerRegistration.findById(req.params.id);
      if (!partner) {
        return res.status(404).json({ success: false, message: "Partner registration not found" });
      }
      res.json({ success: true, data: partner });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  /**
   * Update registration status (for admin)
   */
  async updateStatus(req, res) {
    try {
      const { status } = req.body;
      const partner = await PartnerRegistration.findByIdAndUpdate(
        req.params.id,
        { status },
        { new: true }
      );
      if (!partner) {
        return res.status(404).json({ success: false, message: "Partner registration not found" });
      }
      res.json({ success: true, data: partner });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  /**
   * Delete partner registration (for admin)
   */
  async deleteRegistration(req, res) {
    try {
      const partner = await PartnerRegistration.findByIdAndDelete(req.params.id);
      if (!partner) {
        return res.status(404).json({ success: false, message: "Partner registration not found" });
      }
      try {
        await logActivity(
          req,
          "Deleted",
          "Partner Registration",
          `Deleted Partner registration ID: ${req.params.id}`
        );
      } catch (err) {
        console.error("Logger error:", err);
      }
      res.json({ success: true, message: "Partner registration deleted successfully" });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}

module.exports = new PartnerRegistrationController();
