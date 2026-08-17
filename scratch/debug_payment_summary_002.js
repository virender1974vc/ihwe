require('dotenv').config();
const mongoose = require('mongoose');

async function run() {
    await mongoose.connect(process.env.MONGO_URI_MAIN);

    const ExhibitorRegistration = require('../models/ExhibitorRegistration');
    const reg = await ExhibitorRegistration.findById('6a79bf9fcd194fb3296bf8b0')
        .select('exhibitorName financeBreakdown amountPaid balanceAmount penaltyAmount totalPayable installments status paymentDueDate paymentPlanType paymentPlanLabel')
        .lean();

    console.log(JSON.stringify(reg, null, 2));

    await mongoose.disconnect();
}

run().catch((e) => { console.error(e); process.exit(1); });
