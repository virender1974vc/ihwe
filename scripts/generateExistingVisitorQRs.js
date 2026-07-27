const mongoose = require('mongoose');
const qrcode = require('qrcode');
const { secondaryDB } = require('../config/secondaryDb');

// Import models
const CorporateVisitorModel = require('../models/visitor/CorporateVisitorModel');
const GeneralVisitorModel = require('../models/visitor/GeneralVisitorModel');
const FreeHealthCampModel = require('../models/visitor/FreeHealthCampModel');

require('dotenv').config();

const generateQRs = async () => {
    try {
        console.log('Connecting to secondary DB...');
        await mongoose.connect(process.env.MONGO_URI_MAIN || 'mongodb://127.0.0.1:27017/ihwe');

        console.log('Connected. Starting QR generation for visitors...');

        const modelsToUpdate = [
            { name: 'CorporateVisitor', model: CorporateVisitorModel },
            { name: 'GeneralVisitor', model: GeneralVisitorModel },
            { name: 'FreeHealthCamp (Healthcare)', model: FreeHealthCampModel }
        ];

        for (const { name, model } of modelsToUpdate) {
            console.log(`\nProcessing ${name}...`);
            const visitorsWithoutQR = await model.find({
                $or: [{ qrCode: { $exists: false } }, { qrCode: null }, { qrCode: '' }]
            });

            console.log(`Found ${visitorsWithoutQR.length} ${name} records without QR code.`);

            let count = 0;
            for (const visitor of visitorsWithoutQR) {
                if (!visitor.registrationId) continue;

                try {
                    const payload = JSON.stringify({
                        type: 'visitor',
                        registrationId: visitor.registrationId
                    });

                    const qrCodeStr = await qrcode.toDataURL(payload);
                    await model.updateOne({ _id: visitor._id }, { $set: { qrCode: qrCodeStr } });
                    count++;

                    if (count % 10 === 0) {
                        console.log(`Processed ${count} ${name} records...`);
                    }
                } catch (err) {
                    console.error(`Error generating QR for ${visitor.registrationId}:`, err.message);
                }
            }
            console.log(`Finished processing ${count} ${name} records.`);
        }

        console.log('\nAll done!');
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
};

generateQRs();
