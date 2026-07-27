'use strict';

async function sendOtpEmail(email, otp, name, context = 'GENERAL') {
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
        } else if (context === 'DELEGATE' || context.includes('delegate')) {
            contextTitle = 'Delegate Registration';
            contextDescription = 'registering as a Delegate';
            dashboardText = 'IHWE Delegate Portal';
            contextGreeting = 'Delegate';
        } else if (context === 'SELLER' || context.includes('seller')) {
            contextTitle = 'Seller Registration';
            contextDescription = 'registering as a Seller';
            dashboardText = 'IHWE Seller Dashboard';
            contextGreeting = 'Seller';
        } else if (context === 'SPONSOR' || context.includes('sponsor')) {
            contextTitle = 'Sponsorship Inquiry';
            contextDescription = 'expressing interest in Sponsorship';
            dashboardText = 'IHWE Partner Ecosystem';
            contextGreeting = 'Potential Sponsor';
        } else if (context === 'EXPO_SUPPORT' || context.includes('expo_support')) {
            contextTitle = 'Expo Support Enquiry';
            contextDescription = 'requesting Expo Support Services';
            dashboardText = 'IHWE Partner Network';
            contextGreeting = 'Exhibitor';
        } else if (context === 'ADMIN' || context.includes('admin')) {
            contextTitle = 'Admin Login';
            contextDescription = 'logging into the Admin Panel';
            dashboardText = 'IHWE Admin Dashboard';
            contextGreeting = 'Admin';
        }

        const subject = `IHWE ${contextTitle} – Email Verification OTP`;
        const html = this.emailShell(`
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
        `);
        return await this.sendEmail({ to: email, subject, html });
    }

module.exports = sendOtpEmail;
