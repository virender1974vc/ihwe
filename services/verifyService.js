const Otp = require('../models/Otp');
const emailService = require('../utils/emailService');
const { sendWhatsAppOTP } = require('../utils/whatsapp');

/**
 * Service to handle Verification (OTP) operations.
 */
class VerifyService {
    /**
     * Helper to generate 6-digit OTP.
     */
    generateOTP() {
        return Math.floor(100000 + Math.random() * 900000).toString();
    }

    /**
     * Send OTP to email.
     */
    async sendEmailOtp(email, context = 'SPEAKER') {
        const otp = this.generateOTP();
        
        await Otp.findOneAndUpdate(
            { identifier: email, type: 'email' },
            { otp, createdAt: new Date() },
            { upsert: true, new: true }
        );

        // Determine context-specific text
        let contextTitle = 'Registration';
        let contextDescription = 'registering';
        let dashboardText = 'IHWE Portal';
        
        if (context === 'BUYER' || context.includes('buyer')) {
            contextTitle = 'Buyer Registration';
            contextDescription = 'registering as a Buyer';
            dashboardText = 'IHWE Buyer Dashboard';
        } else if (context === 'EXHIBITOR' || context.includes('exhibitor')) {
            contextTitle = 'Exhibitor Registration';
            contextDescription = 'registering as an Exhibitor';
            dashboardText = 'IHWE Exhibitor Dashboard';
        } else if (context === 'VISITOR' || context.includes('visitor')) {
            contextTitle = 'Visitor Registration';
            contextDescription = 'registering as a Visitor';
            dashboardText = 'IHWE Visitor Portal';
        } else if (context === 'SPEAKER' || context.includes('speaker')) {
            contextTitle = 'Speaker Registration';
            contextDescription = 'registering as a Speaker';
            dashboardText = 'IHWE Speaker Portal';
        }

        const subject = `IHWE ${contextTitle} – Email Verification OTP`;
        
        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
                    .container { max-width: 800px; margin: 20px auto; border: 1px solid #e1e1e1; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.05); }
                    .header { background: linear-gradient(135deg, #23471d 0%, #3d6b33 100%); padding: 30px; text-align: center; color: white; }
                    .content { padding: 40px; background: #ffffff; }
                    .footer { background: #f9fafb; padding: 20px; text-align: center; font-size: 12px; color: #6b7280; border-top: 1px solid #f3f4f6; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1 style="margin:0; font-size: 22px;">9th International Health & Wellness Expo</h1>
                        <p style="margin:5px 0 0; opacity: 0.8; font-size: 14px;">Global Health Connect | IHWE 2026</p>
                    </div>
                    <div class="content">
                        <div style="text-align: left; max-width: 600px; margin: 0 auto; color: #333;">
                            <p style="margin-bottom: 20px; font-size: 15px; line-height: 1.6;">Hello,</p>
                            
                            <p style="margin-bottom: 20px; font-size: 14px; line-height: 1.6;">
                                Thank you for ${contextDescription} for the <strong>International Health & Wellness Expo (IHWE)</strong>.
                            </p>
                            
                            <p style="margin-bottom: 25px; font-size: 14px; line-height: 1.6;">
                                To proceed with your ${contextTitle} and activate your access to the <strong>${dashboardText}</strong>, please verify your email using the One-Time Password (OTP) below:
                            </p>
                            
                            <div style="text-align: center; margin: 30px 0;">
                                <p style="margin: 0 0 10px 0; font-size: 14px; color: #6b7280;">🔐</p>
                                <div style="font-size: 42px; font-weight: 800; color: #d26019; letter-spacing: 10px; font-family: 'Courier New', monospace; line-height: 1.2;">${otp}</div>
                            </div>
                            
                            <p style="margin-bottom: 20px; font-size: 14px; line-height: 1.6;">
                                <strong>This OTP is valid for 10 minutes only</strong> and can be used once.
                            </p>
                            
                            <p style="margin-bottom: 25px; font-size: 14px; line-height: 1.6;">
                                For your security, please do not share this code with anyone. <strong>IHWE or its representatives will never ask for your OTP.</strong>
                            </p>
                            
                            <p style="margin-bottom: 25px; font-size: 14px; line-height: 1.6;">
                                Once verified, our team will review your profile and connect with you shortly for further coordination.
                            </p>
                            
                            <p style="margin-bottom: 35px; font-size: 13px; color: #6b7280; font-style: italic; line-height: 1.6;">
                                If you did not initiate this request, please ignore this email.
                            </p>
                            
                            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
                                <p style="margin: 0 0 5px 0; font-size: 14px; color: #333;">Warm Regards,</p>
                                <p style="margin: 5px 0; font-size: 15px; color: #23471d; font-weight: 700;">Team IHWE</p>
                                <p style="margin: 5px 0; font-size: 13px; color: #6b7280;">International Health & Wellness Expo</p>
                                <p style="margin: 5px 0 0 0; font-size: 12px; color: #9ca3af; font-style: italic;">Global Health Connect</p>
                            </div>
                        </div>
                    </div>
                    <div class="footer">
                         <p style="margin: 0 0 5px 0; font-size: 11px; color: #6b7280;">© 2026 IHWE. All Rights Reserved.</p>
                        <p style="margin: 0; font-size: 10px; color: #9ca3af;">Powered by Namo Gange Wellness Pvt. Ltd.</p>
                    </div>
                </div>
            </body>
            </html>
        `;

        const logData = { message: `OTP for ${contextTitle}` };
        const sent = await emailService.sendEmail({ to: email, subject, html, profile: context, logData });
        return { success: sent };
    }

    /**
     * Verify OTP for email.
     */
    async verifyEmailOtp(email, otp) {
        const record = await Otp.findOne({ identifier: email, otp, type: 'email' });
        if (record) {
            await record.deleteOne();
            return true;
        }
        return false;
    }

    /**
     * Send OTP to phone via WhatsApp.
     */
    async sendPhoneOtp(phone, context = 'CONTACT') {
        const otp = this.generateOTP();
        
        await Otp.findOneAndUpdate(
            { identifier: phone, type: 'phone' },
            { otp, createdAt: new Date() },
            { upsert: true, new: true }
        );

        return await sendWhatsAppOTP(phone, otp, context);
    }

    /**
     * Verify OTP for phone.
     */
    async verifyPhoneOtp(phone, otp) {
        const record = await Otp.findOne({ identifier: phone, otp, type: 'phone' });
        if (record) {
            await record.deleteOne();
            return true;
        }
        return false;
    }
}

module.exports = new VerifyService();
