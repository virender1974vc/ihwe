const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const ExhibitorRegistration = require('../models/ExhibitorRegistration');
require('../models/Event');
const pdfGenerator = require('../utils/pdfGenerator');

async function run() {
    try {
        await mongoose.connect(process.env.MONGO_URI_MAIN);
        console.log('Connected to MongoDB');
        const latestReg = await ExhibitorRegistration.findOne({ 'paymentHistory.0': { $exists: true } }).sort({ createdAt: -1 });
        const result = await pdfGenerator.generatePaymentSlip(latestReg, { paymentIndex: 0 });
        const fs = require('fs');
        const stats = fs.statSync(result.filePath);
        console.log(`Receipt generated: ${result.filePath} (${stats.size} bytes)`);
        console.log('TEST PASSED');
        process.exit(0);
    } catch (err) {
        console.error('TEST FAILED:', err);
        process.exit(1);
    }
}

run();
