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
        let contextGreeting = 'User';
        
        if (context === 'BUYER' || context.includes('buyer')) {
            contextTitle = 'Buyer Registration';
            contextDescription = 'registering as a Buyer';
            dashboardText = 'IHWE Buyer Dashboard';
            contextGreeting = 'Buyer';
        } else if (context === 'EXHIBITOR' || context.includes('exhibitor')) {
            contextTitle = 'Exhibitor Registration';
            contextDescription = 'registering as an Exhibitor';
            dashboardText = 'IHWE Exhibitor Dashboard';
            contextGreeting = 'Exhibitor';
        } else if (context === 'VISITOR' || context.includes('visitor')) {
            contextTitle = 'Visitor Registration';
            contextDescription = 'registering as a Visitor';
            dashboardText = 'IHWE Visitor Portal';
            contextGreeting = 'Visitor';
        } else if (context === 'SPEAKER' || context.includes('speaker')) {
            contextTitle = 'Speaker Registration';
            contextDescription = 'registering as a Speaker';
            dashboardText = 'IHWE Speaker Portal';
            contextGreeting = 'Speaker';
        }

        const subject = `IHWE ${contextTitle} – Email Verification OTP`;
        
        const html = `
            <!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
            <html xmlns="http://www.w3.org/1999/xhtml">
            <head>
                <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
                <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
                <title>IHWE Notification</title>
                <style>
                    body { margin: 0; padding: 0; min-width: 100%; background-color: #ffffff; }
                    table { border-collapse: collapse; }
                    .content-td { padding: 30px 20px; background-color: #ffffff; font-family: 'Segoe UI', Tahoma, Arial, sans-serif; line-height: 1.7; color: #333333; font-size: 16px; }
                    .btn { display: inline-block; padding: 12px 24px; background-color: #23471d; color: #ffffff !important; text-decoration: none; border-radius: 4px; font-weight: 600; margin-top: 15px; }
                    .qr-section { text-align: center; margin: 25px 0; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px; }
                    @media only screen and (max-width: 600px) {
                        .container { width: 100% !important; }
                        .content-td { padding: 20px 15px !important; }
                    }
                </style>
            </head>
            <body style="margin: 0; padding: 0; background-color: #f4f4f4;">
                <table border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed; background-color: #f4f4f4;">
                    <tr>
                        <td align="center" style="padding: 20px 0;">
                            <table border="0" cellpadding="0" cellspacing="0" width="800" class="container" style="background-color: #ffffff; border: 1px solid #eeeeee; width: 100%; max-width: 800px;">
                                <tr>
                                    <td align="center" bgcolor="#23471d" style="background-color: #23471d; padding: 15px 10px;">
                                        <!--[if gte mso 9]>
                                        <v:rect xmlns:v="urn:schemas-microsoft-com:vml" fill="true" stroke="false" style="width:800px;height:60px;">
                                        <v:fill type="solid" color="#23471d" />
                                        <v:textbox inset="0,0,0,0">
                                        <![endif]-->
                                        <div>
                                            <h1 style="margin:0; padding:0; font-size: 18px; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #ffffff; font-weight: 600; text-align: center; line-height: 1.1;">9th International Health & Wellness Expo</h1>
                                            <p style="margin:3px 0 0; padding:0; font-size: 12px; color: #ffffff; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; text-align: center; line-height: 1.1; opacity: 0.9;">Global Health Connect | IHWE 2026</p>
                                        </div>
                                        <!--[if gte mso 9]>
                                        </v:textbox>
                                        </v:rect>
                                        <![endif]-->
                                    </td>
                                </tr>
                                <tr>
                                    <td class="content-td">
                                        <div style="text-align: left; max-width: 600px; margin: 0 auto; color: #333;">
                                            <p style="margin-bottom: 8px; font-size: 15px; line-height: 1.6; font-weight: 600;">Namo Gange Namaskar!</p>
                                            <p style="margin-bottom: 20px; font-size: 15px; line-height: 1.6;">Dear ${contextGreeting},</p>
                                            
                                            <p style="margin-bottom: 20px; font-size: 14px; line-height: 1.6;">
                                                Thank you for ${contextDescription} for the <strong>International Health & Wellness Expo (IHWE)</strong>.
                                            </p>
                                            
                                            <p style="margin-bottom: 25px; font-size: 14px; line-height: 1.6;">
                                                To proceed with your ${contextTitle} and activate your access to the <strong>${dashboardText}</strong>, please verify your email using the One-Time Password (OTP) below:
                                            </p>
                                            
                                            <div style="text-align: center; margin: 30px 0;">
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
                                    </td>
                                </tr>
                                <tr>
                                    <td align="center" style="background: #f9fafb; padding: 20px; border-top: 1px solid #e5e7eb;">
                                        <p style="margin:0; font-size: 13px; color: #6b7280; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.4;">&copy; 2026 IHWE. All Rights Reserved.</p>
                                        <p style="margin:3px 0 0; font-size: 12px; color: #9ca3af; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.4;">Powered by Namo Gange Wellness Pvt. Ltd.</p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                </table>
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
    async sendPhoneOtp(phone, context = 'CONTACT', name = null) {
        const otp = this.generateOTP();
        
        await Otp.findOneAndUpdate(
            { identifier: phone, type: 'phone' },
            { otp, createdAt: new Date() },
            { upsert: true, new: true }
        );

        return await sendWhatsAppOTP(phone, otp, context, name);
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
