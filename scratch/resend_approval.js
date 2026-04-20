const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const EmailService = require('../utils/emailService');
const ExhibitorRegistration = require('../models/ExhibitorRegistration');
const Event = require('../models/Event');
const MessageTemplate = require('../models/MessageTemplate');

async function resend() {
    try {
        console.log('Connecting to DB...');
        await mongoose.connect(process.env.MONGO_URI_MAIN);
        console.log('Connected.');

        const email = 'manishsirohi023@outlook.com';
        console.log(`Searching for registration with email: ${email}`);

        const registration = await ExhibitorRegistration.findOne({ 'contact1.email': email }).populate('eventId');

        if (!registration) {
            console.error('Registration not found for this email.');
            process.exit(1);
        }

        console.log(`Found registration for: ${registration.exhibitorName} (${registration.registrationId})`);
        
        console.log('Sending approval email...');
        const result = await EmailService.sendApprovalEmail(registration);
        
        if (result) {
            console.log('Email sent successfully!');
        } else {
            console.log('Email failed to send (check logs).');
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
        process.exit();
    }
}

resend();
