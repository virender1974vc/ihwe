const mongoose = require('mongoose');
require('dotenv').config();
mongoose.connect(process.env.MONGO_URI_MAIN || 'mongodb://127.0.0.1:27017/ihwe').then(async () => {
    const FreeHealthCamp = require('./models/visitor/FreeHealthCampModel');
    const docs = await FreeHealthCamp.find({ qrCode: { $exists: true, $ne: null, $ne: "" } });
    console.log('Health Camp visitors with QR codes:', docs.length);
    const total = await FreeHealthCamp.countDocuments();
    console.log('Total Health Camp visitors:', total);
    process.exit(0);
}).catch(console.error);
