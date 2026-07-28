'use strict';

async function sendSponsorshipConfirmation(data) {
        try {
            const subject = `Thank You for Your Sponsorship Interest | IHWE 2026`;
            const name = data.name || data.fullName || 'Partner';

            const emailHtml = this.emailShell(`
                <div style="text-align: left; color: #333;">
                    <p style="font-size: 16px; font-weight: 600;">Namo Gange Namaskar!</p>
                    <p>Dear ${name},</p>
                    
                    <p>Thank you for expressing your interest in becoming a <strong>Sponsor</strong> for the <strong>9th International Health & Wellness Expo 2026 (IHWE - Global Edition)</strong>.</p>
                    
                    <p>We have received your enquiry details for the <strong>${data.category || 'Sponsorship'}</strong> category. Our partnership team is currently reviewing your profile and will get in touch with you shortly to discuss tailored opportunities that align with your brand's goals.</p>
                    
                    <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #23471d;">
                        <p style="margin: 0; font-weight: 700; color: #23471d; margin-bottom: 10px;">Enquiry Summary:</p>
                        <p style="margin: 5px 0;"><strong>Company:</strong> ${data.company || 'N/A'}</p>
                        <p style="margin: 5px 0;"><strong>Category:</strong> ${data.category || 'N/A'}</p>
                        <p style="margin: 5px 0;"><strong>Phone:</strong> ${data.phone || 'N/A'}</p>
                    </div>

                    <p>At IHWE 2026, we are committed to providing our sponsors with maximum visibility and strategic networking opportunities within the global wellness ecosystem.</p>
                    
                    <p>Should you have any immediate questions, please feel free to reply to this email or contact us at <strong>+91 9654900525</strong>.</p>
                    
                    <p style="margin-top: 30px;">Best Regards,</p>
                    <p><strong>Partnership Team</strong><br>International Health & Wellness Expo<br>Namo Gange Wellness Pvt. Ltd.</p>
                </div>
            `);


            await this.sendEmail({
                to: data.email,
                subject,
                html: emailHtml,
                profile: 'CONTACT'
            });


            const whatsappMsg = `*Namo Gange Namaskar!* 🙏\n\nDear *${name}*,\n\nThank you for your interest in *Sponsoring IHWE 2026*. We have received your enquiry for the *${data.category || 'Sponsorship'}* category.\n\nOur partnership team is reviewing your details and will contact you shortly to discuss how we can elevate your brand at the expo.\n\n*Team IHWE*\nNamo Gange Wellness Pvt. Ltd.`;

            if (data.phone) {
                await whatsapp.sendWhatsAppMessage(data.phone, whatsappMsg, 'Sponsorship Confirmation');
            }


            await this.sendSponsorshipAdminNotification(data);

            return true;
        } catch (error) {
            console.error('Error in sendSponsorshipConfirmation:', error);
            return false;
        }
    }

module.exports = sendSponsorshipConfirmation;
