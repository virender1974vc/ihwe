const Referral = require('../models/Referral');
const emailService = require('../utils/emailService');
const whatsapp = require('../utils/whatsapp');

class ReferralController {
  /**
   * Create a new referral
   */
  async createReferral(req, res) {
    try {
      const { companyName, contactPerson, mobileNumber, emailId, category, remarks } = req.body;

      if (!companyName || !contactPerson || !mobileNumber) {
        return res.status(400).json({ success: false, message: 'Missing required fields' });
      }

      // Save referral to database
      const referral = await Referral.create({
        companyName,
        contactPerson,
        mobileNumber,
        emailId,
        category,
        remarks,
      });

      // Send WhatsApp to User
      const whatsappMsg = `Namo Gange Namaskar!\n\nDear ${contactPerson},\n\nThank you for submitting a referral for ${companyName} to the International Health & Wellness Expo (IHWE) 2026.\n\nOur team will connect with them shortly. Upon successful stall booking and payment realization by your referred client, your 10% referral bonus will be processed.\n\n– Team IHWE\nNamo Gange Wellness Pvt. Ltd.`;
      
      whatsapp.sendWhatsAppMessage(mobileNumber, whatsappMsg, 'Referral Submission').catch(err => {
        console.error('[WhatsApp] Failed to send referral confirmation:', err.message);
      });

      // Send Email to User (if email provided)
      if (emailId) {
        const emailSubject = 'Referral Submission Confirmation | IHWE 2026';
        const emailBody = `
          <p>Dear ${contactPerson},</p>
          <p>Thank you for submitting a referral for <strong>${companyName}</strong> to the International Health & Wellness Expo (IHWE) 2026.</p>
          <p>Our team will connect with them shortly.</p>
          <p><strong>Bonus Terms:</strong> Your 10% referral bonus will be processed after the successful stall booking and payment realization by your referred client.</p>
          <br/>
          <p>Best Regards,</p>
          <p>Team IHWE 2026<br/>Namo Gange Wellness Pvt. Ltd.</p>
        `;
        
        const html = emailService.emailShell(emailBody, {});
        
        emailService.sendEmail({
            to: emailId,
            subject: emailSubject,
            html: html,
            profile: 'DEFAULT',
            logData: { name: contactPerson, phone: mobileNumber, message: 'Referral Submission Confirmation' }
        }).catch(err => {
            console.error('[Email] Failed to send referral confirmation:', err.message);
        });
      }

      // Send Notification to Admin
      emailService.notifyAdmin('referral', {
          name: contactPerson,
          company: companyName,
          phone: mobileNumber,
          email: emailId || 'N/A',
          category: category || 'N/A',
          remarks: remarks || 'N/A'
      }, 'New Referral Submission', 'DEFAULT').catch(err => {
          console.error('[AdminNotification] Failed for Referral:', err.message);
      });

      res.status(201).json({ success: true, message: 'Referral submitted successfully', data: referral });
    } catch (error) {
      console.error('Error creating referral:', error);
      res.status(500).json({ success: false, message: 'Failed to submit referral' });
    }
  }

  /**
   * Get all referrals
   */
  async getReferrals(req, res) {
    try {
      const referrals = await Referral.find().sort({ createdAt: -1 });
      res.json({ success: true, data: referrals });
    } catch (error) {
      console.error('Error fetching referrals:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch referrals' });
    }
  }

  /**
   * Delete a referral
   */
  async deleteReferral(req, res) {
    try {
      const { id } = req.params;
      const referral = await Referral.findByIdAndDelete(id);

      if (!referral) {
        return res.status(404).json({ success: false, message: 'Referral not found' });
      }

      res.json({ success: true, message: 'Referral deleted successfully' });
    } catch (error) {
      console.error('Error deleting referral:', error);
      res.status(500).json({ success: false, message: 'Failed to delete referral' });
    }
  }
  /**
   * Update a referral
   */
  async updateReferral(req, res) {
    try {
      const { id } = req.params;
      const updates = req.body;
      const referral = await Referral.findByIdAndUpdate(id, updates, { new: true, runValidators: true });
      if (!referral) {
        return res.status(404).json({ success: false, message: 'Referral not found' });
      }
      res.json({ success: true, message: 'Referral updated successfully', data: referral });
    } catch (error) {
      console.error('Error updating referral:', error);
      res.status(500).json({ success: false, message: 'Failed to update referral' });
    }
  }
}

module.exports = new ReferralController();
