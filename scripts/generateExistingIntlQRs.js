require('dotenv').config();
const mongoose = require('mongoose');
const qrcode = require('qrcode');
const InternationalBuyer = require('../models/InternationalBuyer');

async function run() {
    try {
        await mongoose.connect(process.env.MONGO_URI_MAIN || 'mongodb://127.0.0.1:27017/ihwe');
        console.log('Connected to DB');

        // Backfill International Buyers
        const buyers = await InternationalBuyer.find({
            registrationId: { $exists: true, $ne: null },
            $or: [{ qrCode: { $exists: false } }, { qrCode: null }, { qrCode: '' }]
        });
        console.log(`Found ${buyers.length} international buyers needing QR codes.`);
        for (const buyer of buyers) {
            // Note: earlier I just used registrationId for InternationalBuyer in the service, but the original script used JSON.stringify({ registrationId: ... }).
            // Let's stick to what I just added in the service: registrationId directly, but maybe JSON payload is better? 
            // Wait, the service does: qrCodeDataURI = await qrcode.toDataURL(registrationId, ...);
            // I'll stick to what the service does for consistency.
            const qrCodeStr = await qrcode.toDataURL(buyer.registrationId, {
                errorCorrectionLevel: 'M',
                margin: 2,
                width: 200,
                color: { dark: '#000000', light: '#ffffff' }
            });
            buyer.qrCode = qrCodeStr;
            await buyer.save();
        }
        console.log('International buyers updated.');

        console.log('Done!');
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

run();
