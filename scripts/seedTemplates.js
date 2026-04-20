const mongoose = require('mongoose');
const dotenv = require('dotenv');
const MessageTemplate = require('../models/MessageTemplate');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const defaultTemplates = [
    {
        formType: 'general-visitor',
        emailSubject: 'VISITOR REGISTRATION CONFIRMED | 9TH IHWE 2026',
        emailBody: `
            <p>Dear [[NAME]],</p>
            <p>Greetings from the <strong>9th Edition of International Health &amp; Wellness Expo 2026 (IHWE – Global Edition)</strong>.</p>
            <p>We are pleased to confirm your registration as a <strong>General Visitor</strong> for this prestigious international platform, bringing together global leaders, innovators, and stakeholders from the health, wellness, and sustainability ecosystem.</p>

            <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #23471d;">
                <p style="margin:0 0 8px;"><strong>Registration ID:</strong> [[REG_ID]]</p>
                <p style="margin:0 0 8px;"><strong>Event Date:</strong> 21st August to 23rd August 2026</p>
                <p style="margin:0 0 8px;"><strong>Venue:</strong> Hall No. 8, 9 &amp; 10, Pragati Maidan, New Delhi, Bharat</p>
                <p style="margin:0;"><strong>Timings:</strong> 09:30 AM to 6:30 PM (Open for Visitors)</p>
            </div>

            [[QR_CODE]]

            <p style="font-size:13px;color:#374151;"><strong>📸 Important Note:</strong></p>
            <ul style="font-size:13px;color:#374151;">
                <li>This QR Code is valid for exhibition area access only.</li>
                <li>To attend the Arogya Sangosthi Seminar, please register separately.</li>
                <li>To attend the Buyer Seller Meet, please register separately.</li>
            </ul>

            <div style="background:#f0fdf4;padding:16px;border-radius:8px;margin:20px 0;border:1px solid #bbf7d0;">
                <p style="margin:0 0 6px;font-weight:700;color:#15803d;">BUYER REGISTRATION (RECOMMENDED)</p>
                <p style="margin:0;font-size:13px;color:#374151;">To maximize your business engagement and unlock exclusive B2B opportunities, we strongly recommend registering as a Buyer.</p>
            </div>

            <div style="background:#f0fdf4;padding:16px;border-radius:8px;margin:20px 0;border:1px solid #bbf7d0;">
                <p style="margin:0 0 6px;font-weight:700;color:#15803d;">SUPPORT TEAM</p>
                <p style="margin:0;font-size:13px;color:#374151;">📞 Dharmendra: 9220448101 &nbsp;|&nbsp; 📞 Swati: 9311301071 &nbsp;|&nbsp; 📞 Gaurav: 7042466330</p>
            </div>

            <p>We look forward to welcoming you to the <strong>9th Edition of International Health &amp; Wellness Expo 2026</strong>.</p>
            <p>May Mother Ganga bless you with health, prosperity, and well-being.</p>
            <p>With warm regards,<br/><strong>Team IHWE | Namo Gange Trust®</strong></p>
        `,
        whatsappBody: 'Hello [[NAME]]! 👋\n\nYour Visitor registration for the 9th IHWE 2026 is CONFIRMED! ✅\n\nRegistration ID: [[REG_ID]]\n📅 Date: 21–23 August 2026\n📍 Venue: Hall 8, 9 & 10, Pragati Maidan, New Delhi\n\nYour entry QR code has been sent to your email. Please present it at the entrance.\n\nWe look forward to welcoming you!\n\nBest Regards,\nTeam IHWE | Namo Gange Trust®'
    },
    {
        formType: 'corporate-visitor',
        emailSubject: 'CORPORATE VISITOR REGISTRATION CONFIRMED | 9TH IHWE 2026',
        emailBody: `
            <p>Dear [[NAME]],</p>
            <p>Greetings from the <strong>9th Edition of International Health &amp; Wellness Expo 2026 (IHWE – Global Edition)</strong>.</p>
            <p>We are pleased to confirm your registration as a <strong>Corporate Visitor</strong> for this prestigious international platform, bringing together global leaders, innovators, and stakeholders from the health, wellness, and sustainability ecosystem.</p>

            <div style="background: #e8f5e9; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #23471d;">
                <p style="margin:0 0 8px;"><strong>Registration ID:</strong> [[REG_ID]]</p>
                <p style="margin:0 0 8px;"><strong>Event Date:</strong> 21st August to 23rd August 2026</p>
                <p style="margin:0 0 8px;"><strong>Venue:</strong> Hall No. 8, 9 &amp; 10, Pragati Maidan, New Delhi, Bharat</p>
                <p style="margin:0;"><strong>Timings:</strong> 09:30 AM to 6:30 PM (Open for Visitors)</p>
            </div>

            [[QR_CODE]]

            <p style="font-size:13px;color:#374151;"><strong>📸 Important Note:</strong></p>
            <ul style="font-size:13px;color:#374151;">
                <li>This QR Code is valid for exhibition area access only.</li>
                <li>To attend the Arogya Sangosthi Seminar, please register separately.</li>
                <li>To attend the Buyer Seller Meet, please register separately.</li>
            </ul>

            <div style="background:#f0fdf4;padding:16px;border-radius:8px;margin:20px 0;border:1px solid #bbf7d0;">
                <p style="margin:0 0 6px;font-weight:700;color:#15803d;">BUYER REGISTRATION (RECOMMENDED)</p>
                <p style="margin:0;font-size:13px;color:#374151;">To maximize your business engagement and unlock exclusive B2B opportunities, we strongly recommend registering as a Buyer.</p>
            </div>

            <div style="background:#f0fdf4;padding:16px;border-radius:8px;margin:20px 0;border:1px solid #bbf7d0;">
                <p style="margin:0 0 6px;font-weight:700;color:#15803d;">SUPPORT TEAM</p>
                <p style="margin:0;font-size:13px;color:#374151;">📞 Dharmendra: 9220448101 &nbsp;|&nbsp; 📞 Swati: 9311301071 &nbsp;|&nbsp; 📞 Gaurav: 7042466330</p>
            </div>

            <p>We look forward to welcoming you to the <strong>9th Edition of International Health &amp; Wellness Expo 2026</strong>.</p>
            <p>May Mother Ganga bless you with health, prosperity, and well-being.</p>
            <p>With warm regards,<br/><strong>Team IHWE | Namo Gange Trust®</strong></p>
        `,
        whatsappBody: 'Hello [[NAME]]! 👋\n\nYour Corporate Visitor registration for the 9th IHWE 2026 is CONFIRMED! ✅\n\nRegistration ID: [[REG_ID]]\n📅 Date: 21–23 August 2026\n📍 Venue: Hall 8, 9 & 10, Pragati Maidan, New Delhi\n\nYour entry QR code has been sent to your email. Please present it at the entrance.\n\nWe look forward to welcoming you!\n\nBest Regards,\nTeam IHWE | Namo Gange Trust®'
    },
    {
        formType: 'health-camp-visitor',
        emailSubject: 'Health Camp Registration - 9th IHWE 2026',
        emailBody: `
            <p>Dear [[NAME]],</p>
            <p>Your registration for the <strong>Free Health Check-up Camp</strong> at 9th IHWE 2026 is confirmed.</p>
            <div style="background: #fff5f5; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f87171;">
                <p><strong>Registration ID:</strong> [[REG_ID]]</p>
                <p><strong>Event:</strong> Free Health Camp</p>
            </div>
            <p>See you at the camp!</p>
        `,
        whatsappBody: 'Hello [[NAME]]! 👋\n\nYour registration for the Free Health Check-up Camp at IHWE 2026 is successful. \n\nRegistration ID: [[REG_ID]]\n\nSee you at the camp!\n\nBest Regards,\nTeam IHWE'
    },
    {
        formType: 'buyer-registration',
        emailSubject: 'BUYER REGISTRATION CONFIRMED | 9TH IHWE 2026',
        emailBody: `
            <p>Dear [[NAME]],</p>
            <p>Greetings from the <strong>9th Edition of International Health &amp; Wellness Expo 2026 (IHWE – Global Edition)</strong>.</p>
            <p>We are pleased to confirm your registration for the <strong>Buyer-Seller Meet</strong> at this prestigious international platform. Your application has been successfully received.</p>

            <div style="background: #e8f5e9; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #23471d;">
                <p style="margin:0 0 8px;"><strong>Registration ID:</strong> [[REG_ID]]</p>
                <p style="margin:0 0 8px;"><strong>Company:</strong> [[COMPANY]]</p>
                <p style="margin:0 0 8px;"><strong>Registration Category:</strong> [[CATEGORY]]</p>
                <p style="margin:0 0 8px;"><strong>Event Date:</strong> 21st August to 23rd August 2026</p>
                <p style="margin:0;"><strong>Venue:</strong> Hall No. 8, 9 &amp; 10, Pragati Maidan, New Delhi, Bharat</p>
            </div>

            [[QR_CODE]]

            <p style="font-size:13px;color:#374151;"><strong>📸 Important Note:</strong></p>
            <ul style="font-size:13px;color:#374151;">
                <li>This QR Code is valid for Buyer-Seller Meet access.</li>
                <li>Our team will review your profile and contact you for meeting scheduling.</li>
                <li>Please carry a digital or printed copy of this email to the venue.</li>
            </ul>

            <div style="background:#f0fdf4;padding:16px;border-radius:8px;margin:20px 0;border:1px solid #bbf7d0;">
                <p style="margin:0 0 6px;font-weight:700;color:#15803d;">SUPPORT TEAM</p>
                <p style="margin:0;font-size:13px;color:#374151;">📞 Dharmendra: 9220448101 &nbsp;|&nbsp; 📞 Swati: 9311301071 &nbsp;|&nbsp; 📞 Gaurav: 7042466330</p>
            </div>

            <p>We look forward to welcoming you to the <strong>9th Edition of International Health &amp; Wellness Expo 2026</strong>.</p>
            <p>May Mother Ganga bless you with health, prosperity, and well-being.</p>
            <p>With warm regards,<br/><strong>Team IHWE | Namo Gange Trust®</strong></p>
        `,
        whatsappBody: 'Hello [[NAME]]! 👋\n\nYour Buyer registration for the 9th IHWE 2026 is CONFIRMED! ✅\n\nRegistration ID: [[REG_ID]]\nCompany: [[COMPANY]]\nCategory: [[CATEGORY]]\n📅 Date: 21–23 August 2026\n📍 Venue: Hall 8, 9 & 10, Pragati Maidan, New Delhi\n\nYour entry QR code has been sent to your email.\n\nBest Regards,\nTeam IHWE | Namo Gange Trust®'
    },
    {
        formType: 'exhibitor-registration',
        emailBody: `
            <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
                <p>Dear [[CONTACT_PERSON]],</p>
                <p>Greetings from <strong>Namo Gange Wellness Pvt. Ltd</strong></p>
                <p>We are delighted to confirm your <strong>stall booking</strong> for the <strong>9th Edition of International Health &amp; Wellness Expo 2026 (IHWE – Global Edition)</strong>.</p>
                <p>Thank you for choosing to be a part of India's premier platform dedicated to health, wellness, and holistic living.</p>
                
                <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
                
                <p style="margin-bottom: 15px;"><strong>📌 Booking Details:</strong></p>
                
                <div style="background-color: #fcfcfc; border: 1px solid #f0f0f0; border-radius: 8px; padding: 25px; margin-bottom: 25px;">
                    <p style="margin: 0 0 12px 0;"><strong>Registration ID:</strong> <span style="color: #666;">[[REGISTRATION_ID]]</span></p>
                    <p style="margin: 0 0 12px 0;"><strong>Stall No.:</strong> <span style="color: #666;">Stall [[STALL_NO]] - [[STALL_DIMENSION]] - [[STALL_SIZE]] - [[STALL_SCHEME]]</span></p>
                    <p style="margin: 0 0 12px 0;"><strong>Event Date:</strong> <span style="color: #666;">21st August to 23rd August 2026</span></p>
                    <p style="margin: 0;"><strong>Venue:</strong> <span style="color: #666;">Hall No. 8, 9 &amp; 10, Pragati Maidan, New Delhi, Bharat</span></p>
                </div>

                <p><strong>About IHWE 2026:</strong></p>
                <p style="font-size: 13px; color: #555; margin-bottom: 20px;">The <strong>9th Global Edition of IHWE</strong> brings together leading brands, innovators, and industry experts from across the world, offering unmatched opportunities for networking, business growth, and global exposure in the health and wellness sector.</p>
                
                <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
                
                <p><strong>Maximize Your Participation:</strong></p>
                <p style="font-size: 13px; color: #333; margin-bottom: 15px;">We strongly encourage you to leverage the following exclusive opportunities to enhance your visibility and business growth:</p>
                
                <div style="margin-bottom: 15px;">
                    <p style="font-weight: bold; margin-bottom: 5px;">Buyer-Seller Meet Registration</p>
                    <p style="font-size: 13px; margin: 0;">👉 <a href="https://ihwe.in/buyer-registration" style="color: #0066cc; text-decoration: underline;">https://ihwe.in/buyer-registration</a></p>
                </div>

                <div style="margin-bottom: 15px;">
                    <p style="font-weight: bold; margin-bottom: 5px;">Seminar / Conference Registration</p>
                    <p style="font-size: 13px; margin: 0;">👉 <a href="https://ihwe.in/speaker-registration" style="color: #0066cc; text-decoration: underline;">https://ihwe.in/speaker-registration</a></p>
                </div>

                <div style="margin-bottom: 15px;">
                    <p style="font-weight: bold; margin-bottom: 5px;">Namo Gange Global Health Excellence Awards 2026</p>
                    <p style="font-size: 13px; margin: 0;">👉 <a href="https://www.ihwe.in/awards" style="color: #0066cc; text-decoration: underline;">https://www.ihwe.in/awards</a></p>
                </div>

                <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />

                <div style="margin-bottom: 20px;">
                    <p><strong>Event Sponsorship Opportunities</strong></p>
                    <p style="font-size: 13px; margin-bottom: 10px;">Position your brand as a <strong>category leader</strong> with premium visibility across the event, marketing campaigns, and on-ground branding.</p>
                    <p style="font-size: 13px; margin-bottom: 10px;">👉 Explore Sponsorship Options: <a href="https://www.ihwe.in/sponsorship" style="color: #0066cc; text-decoration: underline;">https://www.ihwe.in/sponsorship</a></p>
                    <p style="font-size: 13px;">👉 Our team will assist you in selecting the most suitable opportunities based on your business goals.</p>
                </div>

                <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />

                <p style="margin-bottom: 10px;"><strong>🎯 What's Next?</strong></p>
                <p style="font-size: 13px; margin-bottom: 15px;">Our team will <strong>connect with you shortly</strong> for further coordination and onboarding. You will receive access to your <strong>Exhibitor Dashboard</strong>, where you can:</p>
                <ul style="font-size: 13px; color: #444; margin-bottom: 20px;">
                    <li style="margin-bottom: 8px;">Update your company profile</li>
                    <li style="margin-bottom: 8px;">Upload product/service details</li>
                    <li style="margin-bottom: 8px;">Generate leads and manage buyer connections</li>
                    <li>Access important event updates and guidelines</li>
                </ul>

                <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />

                <p style="margin-bottom: 15px;"><strong>🔗 Dashboard Access:</strong></p>
                <div style="background-color: #f9fafb; border-left: 4px solid #23471d; padding: 25px; margin-bottom: 25px;">
                    <p style="margin: 0 0 10px 0;"><strong>Login URL:</strong> <a href="[[LOGIN_URL]]" style="color: #23471d; text-decoration: underline;">[[LOGIN_URL]]</a></p>
                    <p style="margin: 0 0 10px 0;"><strong>Username:</strong> <span style="color: #555;">[[USERNAME]]</span></p>
                    <p style="margin: 0;"><strong>Password:</strong> <span style="color: #555;">[[PASSWORD]]</span></p>
                </div>

                <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />

                <p style="font-size: 13px; margin-bottom: 15px;">We are committed to ensuring a seamless and successful experience for all our exhibitors. Should you require any assistance, please feel free to reach out to our support team.</p>
                <p style="font-size: 13px; margin-bottom: 25px;">We look forward to your participation and wish you great success at IHWE 2026!</p>
                
                <p style="margin: 0;">Warm regards,</p>
                <p style="margin: 5px 0 0 0;"><strong>Team IHWE 2026</strong></p>
                <p style="margin: 0;">Namo Gange Wellness Pvt. Ltd.</p>
            </div>
        `,
        emailSubject: 'REGISTRATION RECEIVED | 9TH IHWE 2026',
        whatsappBody: 'Hello [[CONTACT_PERSON]]! 👋\n\nYour Exhibitor registration for IHWE 2026 has been RECEIVED! 📥\n\nReg ID: [[REGISTRATION_ID]]\nStall No: [[STALL_NO]]\n\nCheck your email for the portal login details and your registration PDF.\n\nBest Regards, Team IHWE'
    },
    {
        formType: 'exhibitor-registration-approved',
        emailSubject: 'REGISTRATION APPROVED ✅ - [[EXHIBITOR_NAME]] | IHWE 2026',
        emailBody: `
            <p>Dear [[CONTACT_PERSON]],</p>
            <p>Greetings from the <b>9th International Health & Wellness Expo 2026</b>!</p>
            <p>Congratulations! We are pleased to inform you that your registration application has been <b>APPROVED</b>. You are now one step closer to showcasing your brand at India's premier health and wellness platform.</p>

            <div style="background: #e8f5e9; padding: 25px; border-radius: 8px; margin: 25px 0; border: 1px solid #166534; text-align: center;">
                <p style="margin: 0 0 10px; font-size: 18px; color: #166534; font-weight: bold;">APPLICATION APPROVED</p>
                <p style="margin: 0; color: #166534; font-size: 14px;">Stall No: [[STALL_NO]] | Registration ID: [[REGISTRATION_ID]]</p>
            </div>

            <p><b>Next Step:</b> Please log in to your dashboard to complete the payment and secure your stall position.</p>

            <div style="background-color: #f9fafb; border-left: 4px solid #23471d; padding: 20px; margin-bottom: 25px;">
                <p style="margin: 0 0 8px 0; font-weight: bold; color: #23471d;">Dashboard Access:</p>
                <p style="margin: 0 0 6px 0; font-size: 13px;"><b>Login URL:</b> <a href="[[LOGIN_URL]]" style="color: #23471d;">[[LOGIN_URL]]</a></p>
                <p style="margin: 0 0 6px 0; font-size: 13px;"><b>Username:</b> [[USERNAME]]</p>
                <p style="margin: 0; font-size: 13px;"><b>Password:</b> [[PASSWORD]]</p>
            </div>

            <p>We look forward to your active participation!</p>
            <p>With warm regards,<br/><strong>Team IHWE | Namo Gange Trust®</strong></p>
        `,
        whatsappBody: 'Congratulations [[CONTACT_PERSON]]! 👋\n\nYour registration for IHWE 2026 has been APPROVED. ✅\n\nPlease login to the Exhibitor Portal to complete the payment and secure your stall [[STALL_NO]].\n\nBest Regards, Team IHWE'
    },
    {
        formType: 'exhibitor-payment-receipt',
        emailSubject: 'PAYMENT RECEIPT - [[EXHIBITOR_NAME]] | IHWE 2026',
        emailBody: `
            <p>Dear [[CONTACT_PERSON]], [[DESIGNATION]] of [[EXHIBITOR_NAME]],</p>
            <p>We are pleased to inform you that your payment has been successfully recorded for <strong>IHWE 2026</strong>. Details are summary below:</p>

            <table style="width:100%; border-collapse:collapse; margin:20px 0; border:1px solid #eeeeee;">
                <tr><td style="padding:12px; border-bottom:1px solid #f9fafb; font-weight:bold; color:#666;">Registration ID</td><td style="padding:12px; border-bottom:1px solid #f9fafb;">[[REGISTRATION_ID]]</td></tr>
                <tr><td style="padding:12px; border-bottom:1px solid #f9fafb; font-weight:bold; color:#666;">Stall Details</td><td style="padding:12px; border-bottom:1px solid #f9fafb;">Stall [[STALL_NO]] ([[STALL_TYPE]])</td></tr>
                <tr><td style="padding:12px; border-bottom:1px solid #f9fafb; font-weight:bold; color:#666;">Total Amount</td><td style="padding:12px; border-bottom:1px solid #f9fafb;">[[TOTAL_AMOUNT]]</td></tr>
                <tr><td style="padding:12px; border-bottom:1px solid #f9fafb; font-weight:bold; color:#23471d;">Amount Received</td><td style="padding:12px; border-bottom:1px solid #f9fafb; font-weight:bold; color:#23471d;">[[AMOUNT_PAID]]</td></tr>
                <tr><td style="padding:12px; border-bottom:1px solid #f9fafb; font-weight:bold; color:#dc2626;">Balance Due</td><td style="padding:12px; border-bottom:1px solid #f9fafb; font-weight:bold; color:#dc2626;">[[BALANCE_DUE]]</td></tr>
                <tr><td style="padding:12px; border-bottom:1px solid #f9fafb; font-weight:bold; color:#666;">Payment Mode</td><td style="padding:12px; border-bottom:1px solid #f9fafb;">[[PAYMENT_MODE]] ([[PAYMENT_METHOD]])</td></tr>
                <tr><td style="padding:12px; font-weight:bold; color:#666;">Transaction ID</td><td style="padding:12px;">[[TRANSACTION_ID]]</td></tr>
            </table>

            <p>Please find the official payment receipt attached as a PDF.</p>
            <p>With warm regards,<br/><strong>Team IHWE | Namo Gange Trust®</strong></p>
        `,
        whatsappBody: 'Hello [[CONTACT_PERSON]]! 👋\n\nPayment Received: [[AMOUNT_PAID]] ✅\n\nReg ID: [[REGISTRATION_ID]]\nStall: [[STALL_NO]]\nBalance Due: [[BALANCE_DUE]]\n\nReceipt PDF has been sent to your email.\n\nBest Regards, Team IHWE'
    },
    {
        formType: 'exhibitor-booking-confirmed',
        emailSubject: 'BOOKING CONFIRMED! 🎊 - [[EXHIBITOR_NAME]] | IHWE 2026',
        emailBody: `
            <p>Dear [[CONTACT_PERSON]],</p>
            <p>🎊 Congratulations! Your stall booking for <b>IHWE 2026</b> is now <strong style="color:#23471d;">OFFICIALLY CONFIRMED</strong>.</p>
            <p>We are delighted to have you as part of India's premier Health and Wellness ecosystem.</p>

            <div style="background: #e8f5e9; padding: 25px; border-radius: 8px; margin: 25px 0; border: 2px solid #166534; text-align: center;">
                <p style="margin:0 0 10px; font-size:22px; color:#166534; font-weight:bold;">STALL CONFIRMED: [[STALL_NO]]</p>
                <p style="margin:0 0 5px; color:#166534; font-size:14px;">Registration ID: [[REGISTRATION_ID]]</p>
                <p style="margin:0; color:#166534; font-size:14px;">Stall Type: [[STALL_TYPE]]</p>
            </div>

            <p>Please use your dashboard to submit your company profile and product details for the event directory.</p>
            
            <p style="text-align: center; margin: 30px 0;">
                <a href="[[LOGIN_URL]]" style="display:inline-block; padding:14px 40px; background:#23471d; color:#ffffff; text-decoration:none; border-radius:6px; font-weight:bold; font-size:16px;">Access Exhibitor Dashboard</a>
            </p>

            <p>May your participation be fruitful and bring immense growth to your business.</p>
            <p>With warm regards,<br/><strong>Team IHWE | Namo Gange Trust®</strong></p>
        `,
        whatsappBody: '🎊 Congratulations [[CONTACT_PERSON]]! \n\nYour booking for Stall [[STALL_NO]] at IHWE 2026 is now CONFIRMED! ✅\n\nReg ID: [[REGISTRATION_ID]]\n\nWe look forward to seeing you at the expo!'
    },
    {
        formType: 'exhibitor-registration-rejection',
        emailSubject: 'REGISTRATION UPDATE - [[EXHIBITOR_NAME]] | IHWE 2026',
        emailBody: `
            <p>Dear [[CONTACT_PERSON]],</p>
            <p>Thank you for your interest in the <b>9th International Health & Wellness Expo 2026</b>.</p>
            <p>We have carefully reviewed your registration application (ID: [[REGISTRATION_ID]]). Regrettably, we are unable to approve your application at this time due to current stall limitations and selection criteria.</p>

            <div style="background: #fef2f2; padding: 25px; border-radius: 8px; margin: 25px 0; border: 1px solid #ef4444; text-align: center;">
                <p style="margin: 0; color: #b91c1c; font-size: 18px; font-weight: bold;">APPLICATION NOT APPROVED</p>
            </div>

            <p>We appreciate the time you took to apply and wish you the very best. We hope to have the opportunity to collaborate in future editions of IHWE.</p>
            <p>With warm regards,<br/><strong>Team IHWE | Namo Gange Trust®</strong></p>
        `,
        whatsappBody: 'Hello [[CONTACT_PERSON]], Update regarding your Reg ID [[REGISTRATION_ID]]: Your application has not been approved at this time.\n\nBest Regards, Team IHWE'
    },
    {
        formType: 'exhibitor-payment-failed',
        emailSubject: 'PAYMENT UNSUCCESSFUL ⚠️ - [[EXHIBITOR_NAME]] | IHWE 2026',
        emailBody: `
            <p>Dear [[CONTACT_PERSON]],</p>
            <p>This is to inform you that your recent payment attempt for <b>IHWE 2026</b> stall booking was unsuccessful.</p>

            <div style="background: #fff1f2; padding: 25px; border-radius: 8px; margin: 25px 0; border: 1px solid #e11d48; text-align: center;">
                <p style="margin: 0 0 10px; font-size: 18px; color: #be123c; font-weight: bold;">PAYMENT ATTEMPT FAILED</p>
                <p style="margin: 0; color: #be123c; font-size: 14px;">Stall No: [[STALL_NO]] | Registration ID: [[REGISTRATION_ID]]</p>
            </div>

            <p>Please log in to your dashboard to retry the payment or contact your relationship manager for assistance.</p>

            <p style="text-align: center; margin: 30px 0;">
                <a href="[[LOGIN_URL]]" style="display:inline-block; padding:12px 30px; background:#e11d48; color:#ffffff; text-decoration:none; border-radius:6px; font-weight:bold;">Retry Payment Now</a>
            </p>

            <p>If the amount has been deducted from your account, please share the transaction proof with us at <b>accounts@ihwe.in</b>.</p>
            <p>With warm regards,<br/><strong>Team IHWE | Namo Gange Trust®</strong></p>
        `,
        whatsappBody: 'Hello [[CONTACT_PERSON]]! ⚠️\n\nYour payment attempt for IHWE 2026 was UNSUCCESSFUL. \n\nPlease login to your portal to retry: [[LOGIN_URL]]\n\nRegards, Team IHWE'
    },
    {
        formType: 'exhibitor-accessory-order',
        emailSubject: 'ACCESSORY ORDER CONFIRMED - [[ORDER_NO]] | IHWE 2026',
        emailBody: `
            <p>Dear [[CONTACT_PERSON]], [[DESIGNATION]] of [[EXHIBITOR_NAME]],</p>
            <p>Your accessory order has been successfully recorded for <strong>Stall [[STALL_NO]]</strong>.</p>

            <p><strong>Order Summary ([[ORDER_NO]]):</strong></p>
            [[ITEM_TABLE]]

            <div style="background:#f9fafb; padding:15px; text-align:right; border-top:1px solid #eeeeee;">
                <p style="margin:0; font-size:16px;"><strong>Grand Total: [[GRAND_TOTAL]]</strong></p>
            </div>

            <p>Please find your accessory receipt attached as a PDF.</p>
            <p>With warm regards,<br/><strong>Team IHWE | Namo Gange Trust®</strong></p>
        `,
        whatsappBody: 'Hello [[CONTACT_PERSON]]! 👋\n\nYour Accessory Order [[ORDER_NO]] for Stall [[STALL_NO]] has been received. ✅\n\nTotal: [[GRAND_TOTAL]]\n\nRegards, Team IHWE'
    },
    {
        formType: 'contact-enquiry',
        emailSubject: 'Thank you for contacting IHWE',
        emailBody: `
            <p>Dear [[NAME]],</p>
            <p>We have received your enquiry regarding <strong>[[SERVICE]]</strong>.</p>
            <p>Our team will review your message and get back to you shortly.</p>
            <div style="border-left: 4px solid #23471d; padding-left: 20px; margin: 20px 0; font-style: italic;">
                "[[MESSAGE]]"
            </div>
            <p>Best Regards,<br>IHWE Support Team</p>
        `,
        whatsappBody: 'Hello [[NAME]]! 👋\n\nThank you for contacting IHWE - Global Health Connect. We have received your inquiry regarding "[[SERVICE]]".\n\nOur team will review your message and get back to you shortly.\n\nBest Regards,\nTeam IHWE'
    },
    {
        formType: 'speaker-nomination',
        emailSubject: 'Speaker Nomination Received - IHWE 2026',
        emailBody: `
            <p>Dear [[FULL_NAME]],</p>
            <p>Thank you for nominating yourself as a speaker for the <strong>9th International Health & Wellness Expo 2026</strong>.</p>
            <p>Our committee is currently reviewing your profile and session topic: "[[TOPIC]]".</p>
            <p>We will contact you if your nomination is shortlisted.</p>
            <p>Regards,<br>Conference Committee, IHWE</p>
        `,
        whatsappBody: 'Hello [[FULL_NAME]]! 👋\n\nThank you for nominating yourself as a speaker for IHWE 2026. We have received your proposal regarding "[[TOPIC]]".\n\nOur Conference Committee will review your nomination and contact you if shortlisted.\n\nBest Regards,\nTeam IHWE'
    }
];

const seedTemplates = async () => {
    try {
        if (!process.env.MONGO_URI_MAIN) {
            throw new Error('MONGO_URI_MAIN not found in .env');
        }
        await mongoose.connect(process.env.MONGO_URI_MAIN);
        console.log('Connected to MongoDB for seeding templates...');

        for (const template of defaultTemplates) {
            await MessageTemplate.findOneAndUpdate(
                { formType: template.formType },
                {
                    ...template,
                    lastUpdatedBy: null, // Initial seed
                },
                { upsert: true, new: true }
            );
            console.log(`Seeded/Updated template for: ${template.formType}`);
        }

        console.log('Templates seeded successfully!');
        process.exit(0);
    } catch (error) {
        console.error('Error seeding templates:', error);
        process.exit(1);
    }
};

seedTemplates();