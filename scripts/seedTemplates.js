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
        emailSubject: 'REGISTRATION RECEIVED | 9TH IHWE 2026',
        emailBody: `
            <p>Dear [[CONTACT_PERSON]], [[DESIGNATION]] of [[EXHIBITOR_NAME]],</p>
            <p>Greetings from the <strong>9th Edition of International Health &amp; Wellness Expo 2026 (IHWE – Global Edition)</strong>.</p>
            <p>We have successfully received your registration application for the upcoming IHWE 2026. Our team is currently reviewing the details provided.</p>

            <div style="border: 1px solid #eeeeee; padding: 20px; border-radius: 4px; margin: 20px 0;">
                <p style="margin:0 0 8px;"><strong>Registration ID:</strong> [[REGISTRATION_ID]]</p>
                <p style="margin:0 0 8px;"><strong>Stall Reservation:</strong> Stall [[STALL_NO]]</p>
                <p style="margin:0 0 8px;"><strong>Event Date:</strong> 21st August to 23rd August 2026</p>
                <p style="margin:0;"><strong>Venue:</strong> Hall No. 8, 9 &amp; 10, Pragati Maidan, New Delhi, Bharat</p>
            </div>

            <p>Please find your registration form attached as a PDF for your records.</p>

            <p><strong>🔐 Your Exhibitor Portal Login</strong></p>
            <p style="font-size:14px; color:#555555;">You can manage your exhibition profile and catalog using the credentials below:</p>
            <div style="background:#f9fafb; padding:15px; border-left:4px solid #23471d; margin:15px 0;">
                <p style="margin:0 0 6px;"><strong>Login URL:</strong> <a href="[[LOGIN_URL]]" style="color:#23471d;">[[LOGIN_URL]]</a></p>
                <p style="margin:0 0 6px;"><strong>Username:</strong> [[USERNAME]]</p>
                <p style="margin:0;"><strong>Password:</strong> <span style="font-family:monospace; font-size:16px; letter-spacing:1px;">[[PASSWORD]]</span></p>
            </div>

            <p>If you have any questions, feel free to reach out to our support team.</p>
            <p>With warm regards,<br/><strong>Team IHWE | Namo Gange Trust®</strong></p>
        `,
        whatsappBody: 'Hello [[CONTACT_PERSON]]! 👋\n\nYour Exhibitor registration for IHWE 2026 has been RECEIVED! 📥\n\nReg ID: [[REGISTRATION_ID]]\nStall No: [[STALL_NO]]\n\nCheck your email for the portal login details and your registration PDF.\n\nBest Regards, Team IHWE'
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
                <tr><td style="padding:12px; border-bottom:1px solid #f9fafb; font-weight:bold; color:#23471d;">Amount Paid</td><td style="padding:12px; border-bottom:1px solid #f9fafb; font-weight:bold; color:#23471d;">[[AMOUNT_PAID]]</td></tr>
                <tr><td style="padding:12px; border-bottom:1px solid #f9fafb; font-weight:bold; color:#dc2626;">Balance Due</td><td style="padding:12px; border-bottom:1px solid #f9fafb; font-weight:bold; color:#dc2626;">[[BALANCE_DUE]]</td></tr>
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
            <p>Dear [[CONTACT_PERSON]], [[DESIGNATION]] of [[EXHIBITOR_NAME]],</p>
            <p>🎊 Congratulations! Your stall booking for <strong>[[EVENT_NAME]]</strong> is now <strong style="color:#23471d;">OFFICIALLY CONFIRMED</strong>.</p>

            <div style="border: 2px solid #23471d; padding: 25px; border-radius: 8px; margin: 25px 0; text-align: center;">
                <p style="margin:0 0 10px; font-size:20px; color:#23471d;"><strong>CONFIRMED STALL: [[STALL_NO]]</strong></p>
                <p style="margin:0 0 5px; color:#666;">Registration ID: [[REGISTRATION_ID]]</p>
                <p style="margin:0; color:#666;">Stall Type: [[STALL_TYPE]]</p>
            </div>

            <p>We are excited to have you with us. Please log in to complete your exhibition showcase:</p>
            <p style="text-align: center;"><a href="[[LOGIN_URL]]" style="display:inline-block; padding:14px 30px; background:#23471d; color:#ffffff; text-decoration:none; border-radius:4px; font-weight:bold;">Access Exhibitor Portal</a></p>

            <p>May your participation at IHWE 2026 be fruitful and rewarding.</p>
            <p>With warm regards,<br/><strong>Team IHWE | Namo Gange Trust®</strong></p>
        `,
        whatsappBody: '🎊 Congratulations [[CONTACT_PERSON]]! \n\nYour booking for Stall [[STALL_NO]] at IHWE 2026 is now CONFIRMED! ✅\n\nReg ID: [[REGISTRATION_ID]]\n\nWe look forward to seeing you at the expo!'
    },
    {
        formType: 'exhibitor-registration-rejection',
        emailSubject: 'REGISTRATION UPDATE - [[EXHIBITOR_NAME]] | IHWE 2026',
        emailBody: `
            <p>Dear [[CONTACT_PERSON]], [[DESIGNATION]] of [[EXHIBITOR_NAME]],</p>
            <p>We regret to inform you that your registration application for <strong>[[EVENT_NAME]]</strong> (Registration ID: [[REGISTRATION_ID]]) has not been approved at this time.</p>
            <p>This decision is based on current stall availability and our selection criteria. We encourage you to participate in our future editions.</p>
            <p>Thank you for your interest in IHWE.</p>
            <p>Best Regards,<br/><strong>Team IHWE</strong></p>
        `,
        whatsappBody: 'Hello [[CONTACT_PERSON]], Update regarding your Reg ID [[REGISTRATION_ID]]: Your application has not been approved at this time.\n\nBest Regards, Team IHWE'
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