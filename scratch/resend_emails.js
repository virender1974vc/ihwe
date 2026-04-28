const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const ExhibitorRegistration = require('../models/ExhibitorRegistration');
const Event = require('../models/Event');
const emailService = require('../utils/emailService');
const pdfGenerator = require('../utils/pdfGenerator');

async function resend() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGO_URI_MAIN);
        console.log('Connected.');

        const reg = await ExhibitorRegistration.findOne({ exhibitorName: /Surya/i }).populate('eventId');

        if (!reg) {
            console.error('Registration not found:', regId);
            process.exit(1);
        }

        console.log('Found Exhibitor:', reg.exhibitorName);

        // Prep PDF Options
        const templateData = await emailService.getExhibitorTemplateData();
        const pdfOptions = {
            headerImage: templateData?.headerImage ? path.resolve(__dirname, '..', templateData.headerImage.replace(/^\//, '')) : null,
            footerImage: templateData?.footerImage ? path.resolve(__dirname, '..', templateData.footerImage.replace(/^\//, '')) : null
        };

        // 1. Generate & Send Registration PDF
        console.log('Generating Registration PDF...');
        const regPdf = await pdfGenerator.generateRegistrationForm(reg, pdfOptions);
        const regPath = regPdf?.filePath || regPdf;
        console.log('Reg PDF generated at:', regPath);
        
        // We need a raw password or just empty if we don't have it
        const rawPassword = 'ADMIN-RESEND'; 
        console.log('Sending Registration Confirmation Email...');
        await emailService.sendRegistrationConfirmation(reg, regPath, rawPassword);
        console.log('Sent.');

        // 2. Generate & Send Payment Receipt PDF
        console.log('Generating Payment Receipt PDF...');
        const receiptPdf = await pdfGenerator.generatePaymentSlip(reg, pdfOptions);
        const receiptPath = receiptPdf?.filePath || receiptPdf;
        console.log('Receipt PDF generated at:', receiptPath);
        
        console.log('Sending Payment Receipt Email...');
        await emailService.sendPaymentReceipt(reg, receiptPath);
        console.log('Sent.');

        console.log('All emails triggered successfully.');
        process.exit(0);
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
}

resend();
