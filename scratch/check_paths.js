const mongoose = require('mongoose');
require('dotenv').config();

async function checkPaths() {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/9th-ihwe');
    const InternationalBuyer = require('../models/InternationalBuyer');
    const buyer = await InternationalBuyer.findOne({ "documents.companyRegistrationCertificate": { $exists: true } });
    if (buyer) {
        console.log("Sample path:", buyer.documents.companyRegistrationCertificate);
    } else {
        console.log("No buyers with documents found.");
    }
    await mongoose.disconnect();
}

checkPaths();
