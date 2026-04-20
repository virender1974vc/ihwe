const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const ExhibitorRegistration = require('../models/ExhibitorRegistration');
require('../models/Event');
const pdfGenerator = require('../utils/pdfGenerator');
const emailService = require('../utils/emailService');

async function resend() {
    try {
        await mongoose.connect(process.env.MONGO_URI_MAIN);
        console.log('✅ Connected to MongoDB');
        const latestReg = await ExhibitorRegistration.findOne({}).sort({ createdAt: -1 }).populate('eventId');

        if (!latestReg) {
            console.error('❌ No registration found');
            process.exit(1);
        }

        console.log(`📄 Found registration: ${latestReg.registrationId} (${latestReg.exhibitorName})`);
        console.log('🛠 Generating PDFs...');
        
        const regPdf = await pdfGenerator.generateRegistrationForm(latestReg);
        const receiptPdf = await pdfGenerator.generatePaymentSlip(latestReg);
        
        const regPath = regPdf.filePath || regPdf;
        const receiptPath = receiptPdf.filePath || receiptPdf;
        
        console.log(`✅ PDFs Generated: \n   1. Registration: ${regPath}\n   2. Receipt: ${receiptPath}`);
        
        latestReg.contact1.email = 'manishsirohi023@gmail.com';

        console.log(`📧 Sending Registration Confirmation to: ${latestReg.contact1.email}...`);
        const sentReg = await emailService.sendRegistrationConfirmation(latestReg, regPath, 'ADMIN_TEST_123');
        
        console.log(`📧 Sending Payment Receipt to: ${latestReg.contact1.email}...`);
        const sentReceipt = await emailService.sendPaymentReceipt(latestReg, receiptPath);

        if (sentReg && sentReceipt) {
            console.log('🚀 Both emails successfully sent!');
        } else {
            console.log(`❌ Status: Reg Sent: ${sentReg}, Receipt Sent: ${sentReceipt}`);
        }

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

resend();
