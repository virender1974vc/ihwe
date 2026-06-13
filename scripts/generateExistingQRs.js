require('dotenv').config();
const mongoose = require('mongoose');
const qrcode = require('qrcode');
const BuyerRegistration = require('../models/BuyerRegistration');
const SellerRegistration = require('../models/SellerRegistration');

async function run() {
    try {
        await mongoose.connect(process.env.MONGO_URI_MAIN || 'mongodb://127.0.0.1:27017/ihwe');
        console.log('Connected to DB');

        // Backfill Buyers
        const buyers = await BuyerRegistration.find({
            registrationId: { $exists: true, $ne: null },
            $or: [{ qrCode: { $exists: false } }, { qrCode: null }]
        });
        console.log(`Found ${buyers.length} buyers needing QR codes.`);
        for (const buyer of buyers) {
            const payload = JSON.stringify({ registrationId: buyer.registrationId });
            const qrCodeStr = await qrcode.toDataURL(payload);
            buyer.qrCode = qrCodeStr;
            await buyer.save();
        }
        console.log('Buyers updated.');

        // Backfill Exhibitors (Sellers)
        const exhibitors = await SellerRegistration.find({
            registrationId: { $exists: true, $ne: null },
            $or: [{ qrCode: { $exists: false } }, { qrCode: null }]
        });
        console.log(`Found ${exhibitors.length} exhibitors needing QR codes.`);
        for (const exhibitor of exhibitors) {
            const payload = JSON.stringify({ registrationId: exhibitor.registrationId });
            const qrCodeStr = await qrcode.toDataURL(payload);
            exhibitor.qrCode = qrCodeStr;
            await exhibitor.save();
        }
        console.log('Exhibitors updated.');

        console.log('Done!');
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

run();
