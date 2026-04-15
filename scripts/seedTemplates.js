const mongoose = require('mongoose');
const dotenv = require('dotenv');
const MessageTemplate = require('../models/MessageTemplate');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const defaultTemplates = [
    {
        formType: 'general-visitor',
        emailSubject: 'Visitor Pass - 9th International Health & Wellness Expo 2026',
        emailBody: `
            <p>Dear [[NAME]],</p>
            <p>Thank you for registering as a Visitor for the <strong>9th International Health & Wellness Expo (IHWE) 2026</strong>.</p>
            <p>Your registration is successful. Below are your details:</p>
            <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <p><strong>Registration ID:</strong> [[REG_ID]]</p>
                <p><strong>Visitor Type:</strong> General Visitor</p>
            </div>
            <p>Please carry a digital or printed copy of this email to the entry gate.</p>
            <p>We look forward to welcoming you at the expo!</p>
        `,
        whatsappBody: 'Hello [[NAME]]! 👋\n\nThank you for registering as a Visitor for the 9th International Health & Wellness Expo 2026. Your Registration ID is: [[REG_ID]].\n\nOur team looks forward to seeing you at the entry gate!\n\nBest Regards,\nTeam IHWE'
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
        emailSubject: 'Hosted Buyer Application Received - IHWE 2026',
        emailBody: `
            <p>Dear [[NAME]],</p>
            <p>We have received your application for the <strong>Hosted Buyer Program</strong> at IHWE 2026.</p>
            <p>Our team will review your company profile (<strong>[[COMPANY]]</strong>) and contact you shortly regarding the approval status.</p>
            <p>Best Regards,<br>Buyer Relations Team, IHWE</p>
        `,
        whatsappBody: 'Hello [[NAME]]! 👋\n\nThank you for applying for the Hosted Buyer Program at IHWE 2026. We have received your details for "[[COMPANY]]".\n\nOur team will review your profile and contact you soon regarding the approval status.\n\nBest Regards,\nTeam IHWE'
    },
    {
        formType: 'exhibitor-registration',
        emailSubject: 'Exhibitor Registration Confirmed - IHWE 2026',
        emailBody: `
            <p>Dear [[EXHIBITOR_NAME]],</p>
            <p>Welcome to the <strong>9th International Health & Wellness Expo 2026</strong> as an Exhibitor.</p>
            <p>Your booking for <strong>Stall [[STALL_NO]]</strong> has been successfully processed.</p>
            <div style="background: #fdf2f8; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px dashed #ec4899;">
                <p><strong>Login URL:</strong> <a href="[[LOGIN_URL]]">[[LOGIN_URL]]</a></p>
                <p><strong>Username:</strong> [[EMAIL]]</p>
                <p><strong>Password:</strong> [[PASSWORD]]</p>
            </div>
            <p>Please log in to the portal to complete your profile and manage your stall.</p>
        `,
        whatsappBody: 'Hello [[EXHIBITOR_NAME]]! 👋\n\nWelcome to IHWE 2026! Your booking for Stall [[STALL_NO]] is successfully confirmed.\n\nYou can manage your stall details at: [[LOGIN_URL]]\nEmail: [[EMAIL]]\nPassword: [[PASSWORD]]\n\nBest Regards,\nTeam IHWE'
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
