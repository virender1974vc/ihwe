const mongoose = require('mongoose');
const path = require('path');

require('dotenv').config();

const mongoUri = process.env.MONGO_URI_MAIN || 'mongodb://127.0.0.1:27017/ihwe';

mongoose.connect(mongoUri)
    .then(async () => {
        console.log('Connected to MongoDB for test email dispatch...');

        const ExhibitorRegistration = require('./models/ExhibitorRegistration');
        const emailServiceInstance = require('./utils/emailService');

        // Find the latest active registration
        const reg = await ExhibitorRegistration.findOne().sort({ createdAt: -1 });
        if (!reg) {
            console.log('No exhibitor registration record found to test with.');
            process.exit(0);
        }

        console.log(`Using registration record for: ${reg.exhibitorName}`);

        const testRecipients = ['manishsirohi023@gmail.com', 'manishsirohi023@outlook.com'];
        for (const testRecipient of testRecipients) {
            reg.contact1.email = testRecipient;
            reg.spokenWith = 'Manish Sirohi';
            reg.amountPaid = 50000;
            reg.balanceAmount = 65580.70;
            reg.financeBreakdown = {
                grossAmount: 118910,
                stallDiscountPercent: 10,
                stallDiscountAmount: 11891,
                discountPercent: 0,
                discountAmount: 0,
                subtotal: 107019,
                gstAmount: 19263.42,
                tdsPercent: 10,
                tdsAmount: 10701.90,
                netPayable: 115580.52
            };
            reg.participation = reg.participation || {};
            reg.participation.rate = 9000;
            reg.participation.stallSize = 12;
            reg.participation.stallType = 'Premium Corner Stand';
            reg.participation.stallFor = 'Stall-908';
            reg.participation.dimension = '4m x 3m';
            reg.participation.stallScheme = 'Shell Scheme';

            console.log(`Triggering simulated partial payment receipt email to: ${testRecipient}`);

            const success = await emailServiceInstance.sendPaymentReceipt(reg, null);

            if (success) {
                console.log(`Test payment receipt email successfully dispatched to ${testRecipient}!`);
            } else {
                console.log(`Failed to dispatch test payment receipt email to ${testRecipient}.`);
            }
        }

        process.exit(0);
    })
    .catch(err => {
        console.error('Database connection error:', err);
        process.exit(1);
    });
