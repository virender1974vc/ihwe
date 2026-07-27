'use strict';

async function sendExpoSupportConfirmation(data) {
        try {
            const subject = `Expo Support Request Received | IHWE 2026`;
            const name = data.name || data.fullName || 'Exhibitor';
            const servicesText = Array.isArray(data.services) ? data.services.join(', ') : (data.services || 'General Support');

            const emailHtml = this.emailShell(`
                <div style="text-align: left; color: #333;">
                    <p style="font-size: 16px; font-weight: 600;">Namo Gange Namaskar!</p>
                    <p>Dear ${name},</p>
                    
                    <p>Thank you for reaching out for <strong>Expo Support Services</strong> for the <strong>9th International Health & Wellness Expo 2026 (IHWE - Global Edition)</strong>.</p>
                    
                    <p>We have received your requirements for <strong>${servicesText}</strong>. Our logistics and support team is currently reviewing your request and will connect you with our designated partners shortly to provide the best solutions and rates.</p>
                    
                    <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #1c88bc;">
                        <p style="margin: 0; font-weight: 700; color: #1c88bc; margin-bottom: 10px;">Enquiry Summary:</p>
                        <p style="margin: 5px 0;"><strong>Company:</strong> ${data.company || 'N/A'}</p>
                        <p style="margin: 5px 0;"><strong>Requested Service(s):</strong> ${servicesText}</p>
                        <p style="margin: 5px 0;"><strong>Phone:</strong> ${data.phone || 'N/A'}</p>
                    </div>

                    <p>Our goal is to ensure you have a seamless and successful exhibition experience. If you have any immediate requirements, feel free to contact our help desk.</p>
                    
                    <p style="margin-top: 30px;">Best Regards,</p>
                    <p><strong>Support & Logistics Team</strong><br>International Health & Wellness Expo<br>Namo Gange Wellness Pvt. Ltd.</p>
                </div>
            `);


            await this.sendEmail({
                to: data.email,
                subject,
                html: emailHtml,
                profile: 'CONTACT'
            });


            const whatsappMsg = `*Namo Gange Namaskar!* 🙏\n\nDear *${name}*,\n\nThank you for requesting *Expo Support* for IHWE 2026. We have received your requirements for: *${servicesText}*.\n\nOur team is reviewing your request and will connect you with the right partners shortly to assist you.\n\n*Team IHWE*\nNamo Gange Wellness Pvt. Ltd.`;

            if (data.phone) {
                await whatsapp.sendWhatsAppMessage(data.phone, whatsappMsg, 'Expo Support Confirmation');
            }


            await this.sendExpoSupportAdminNotification(data);

            return true;
        } catch (error) {
            console.error('Error in sendExpoSupportConfirmation:', error);
            return false;
        }
    }

module.exports = sendExpoSupportConfirmation;
