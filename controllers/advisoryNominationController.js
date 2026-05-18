const AdvisoryNomination = require('../models/AdvisoryNomination');
const emailService = require('../utils/emailService');
const whatsapp = require('../utils/whatsapp');
const { logActivity } = require('../utils/logger');

class AdvisoryNominationController {
    /**
     * Submit a new nomination
     */
    async submitNomination(req, res) {
        try {
            const nominationData = req.body;
            
            // Basic validation
            const requiredFields = [
                'fullName', 'designation', 'organization', 'industry', 'email', 'phone',
                'areasOfExpertise', 'yearsOfExperience', 'professionalSummary',
                'whyRecommend', 'contribution', 'nominatorName', 'nominatorDesignation',
                'nominatorOrg', 'nominatorEmail', 'nominatorPhone', 'relationship'
            ];

            for (const field of requiredFields) {
                if (!nominationData[field]) {
                    return res.status(400).json({ success: false, message: `Field ${field} is required` });
                }
            }

            // Check if email already exists
            const existing = await AdvisoryNomination.findOne({ email: nominationData.email });
            if (existing && existing.otpVerifiedEmail) {
                // Allow resubmission if not verified, but here we assume frontend handles verification
                // return res.status(400).json({ success: false, message: 'A nomination with this email already exists' });
            }

            // Create new nomination
            const nomination = new AdvisoryNomination(nominationData);
            
            // If file was uploaded (handled by multer in routes)
            if (req.file) {
                nomination.cvPath = `/uploads/advisory/cv/${req.file.filename}`;
            }

            await nomination.save();

            // Log activity
            await logActivity(req, 'Created', 'Advisory Nomination', `New nomination for: ${nomination.fullName} by ${nomination.nominatorName}`);

            // Send Confirmation Email & WhatsApp
            try {
                await this.sendConfirmations(nomination);
            } catch (err) {
                console.error('Error sending confirmations:', err);
                // Don't fail the request if notifications fail
            }

            res.status(201).json({
                success: true,
                message: 'Nomination submitted successfully',
                data: nomination
            });

        } catch (error) {
            console.error('Error in submitNomination:', error);
            res.status(500).json({ success: false, message: error.message || 'Internal Server Error' });
        }
    }

    /**
     * Send confirmations (Email & WhatsApp)
     */
    async sendConfirmations(nomination) {
        // 1. Email to Nominee (and/or Nominator)
        const emailData = {
            fullName: nomination.fullName,
            registrationId: nomination.registrationId,
            designation: nomination.designation,
            organization: nomination.organization,
            nominatorName: nomination.nominatorName
        };

        // Send to Nominee
        await emailService.sendEmail({
            to: nomination.email,
            subject: `Advisory Board Nomination Received | IHWE 2026 | ${nomination.registrationId}`,
            html: this.getNomineeEmailTemplate(emailData),
            profile: 'DEFAULT'
        });

        // Send to Nominator
        await emailService.sendEmail({
            to: nomination.nominatorEmail,
            subject: `Nomination Submitted Successfully | Advisory Board | IHWE 2026`,
            html: this.getNominatorEmailTemplate(emailData),
            profile: 'DEFAULT'
        });

        // 2. WhatsApp to Nominee
        const whatsappMsg = `Namo Gange Namaskar!\n\nDear ${nomination.fullName},\n\nWe are pleased to inform you that you have been nominated for the *Advisory Board* of the *9th International Health & Wellness Expo 2026 (IHWE)*.\n\n*Nomination ID:* ${nomination.registrationId}\n*Nominated By:* ${nomination.nominatorName}\n\nOur committee will review the nomination and get in touch with you soon.\n\nBest Regards,\nTeam IHWE\nNamo Gange Wellness Pvt. Ltd.`;
        
        await whatsapp.sendWhatsAppMessage(nomination.phone, whatsappMsg, 'Advisory Nomination Confirmation');
    }

    getNomineeEmailTemplate(data) {
        return `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #333; line-height: 1.6; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 10px; overflow: hidden;">
            <div style="background-color: #1a5c2a; padding: 20px; text-align: center; color: white;">
                <h1 style="margin: 0; font-size: 24px;">Advisory Board Nomination</h1>
                <p style="margin: 5px 0 0; opacity: 0.8;">International Health & Wellness Expo 2026</p>
            </div>
            <div style="padding: 30px;">
                <p>Dear <strong>${data.fullName}</strong>,</p>
                <p>Namo Gange Namaskar!</p>
                <p>We are honored to inform you that you have been nominated to join the <strong>Advisory Board</strong> of the <strong>9th International Health & Wellness Expo 2026 (IHWE)</strong>.</p>
                
                <div style="background-color: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #1a5c2a;">
                    <p style="margin: 0;"><strong>Nomination ID:</strong> ${data.registrationId}</p>
                    <p style="margin: 5px 0 0;"><strong>Nominated By:</strong> ${data.nominatorName}</p>
                </div>

                <p>Your expertise and leadership in the industry are highly recognized, and your contribution to the Advisory Board will help shape the future of global health and wellness.</p>
                
                <p>The selection committee is currently reviewing all nominations. We will notify you of the final decision and the next steps in due course.</p>
                
                <p>Should you have any questions, please feel free to contact us at <a href="mailto:info@ihwe.in" style="color: #1a5c2a; text-decoration: none; font-weight: bold;">info@ihwe.in</a>.</p>
                
                <p style="margin-top: 30px;">Best Regards,</p>
                <p><strong>Team IHWE 2026</strong><br>Namo Gange Wellness Pvt. Ltd.</p>
            </div>
            <div style="background-color: #f4f4f4; padding: 15px; text-align: center; font-size: 12px; color: #777;">
                <p style="margin: 0;">&copy; 2026 IHWE. All Rights Reserved.</p>
            </div>
        </div>
        `;
    }

    getNominatorEmailTemplate(data) {
        return `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #333; line-height: 1.6; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 10px; overflow: hidden;">
            <div style="background-color: #1a5c2a; padding: 20px; text-align: center; color: white;">
                <h1 style="margin: 0; font-size: 24px;">Nomination Submitted</h1>
                <p style="margin: 5px 0 0; opacity: 0.8;">International Health & Wellness Expo 2026</p>
            </div>
            <div style="padding: 30px;">
                <p>Dear <strong>${data.nominatorName}</strong>,</p>
                <p>Thank you for submitting a nomination for the <strong>IHWE 2026 Advisory Board</strong>.</p>
                
                <p>We have successfully received your nomination for <strong>${data.fullName}</strong> (${data.designation} at ${data.organization}).</p>
                
                <div style="background-color: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #1a5c2a;">
                    <p style="margin: 0;"><strong>Nomination ID:</strong> ${data.registrationId}</p>
                </div>

                <p>Our committee will review the details provided. We appreciate your contribution in identifying exceptional leaders for our global platform.</p>
                
                <p style="margin-top: 30px;">Best Regards,</p>
                <p><strong>Team IHWE 2026</strong><br>Namo Gange Wellness Pvt. Ltd.</p>
            </div>
            <div style="background-color: #f4f4f4; padding: 15px; text-align: center; font-size: 12px; color: #777;">
                <p style="margin: 0;">&copy; 2026 IHWE. All Rights Reserved.</p>
            </div>
        </div>
        `;
    }

    async getNominationById(req, res) {
        try {
            const nomination = await AdvisoryNomination.findById(req.params.id);
            if (!nomination) {
                return res.status(404).json({ success: false, message: 'Nomination not found' });
            }
            res.json({ success: true, data: nomination });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    /**
     * Get all nominations (for admin)
     */
    async getAllNominations(req, res) {
        try {
            const nominations = await AdvisoryNomination.find().sort({ createdAt: -1 });
            res.json({ success: true, data: nominations });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    /**
     * Update nomination status
     */
    async updateStatus(req, res) {
        try {
            const { status } = req.body;
            const nomination = await AdvisoryNomination.findByIdAndUpdate(
                req.params.id,
                { status },
                { new: true }
            );
            if (!nomination) {
                return res.status(404).json({ success: false, message: 'Nomination not found' });
            }
            res.json({ success: true, data: nomination });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
}

module.exports = new AdvisoryNominationController();
