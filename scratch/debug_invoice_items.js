require('dotenv').config();
const mongoose = require('mongoose');

async function run() {
    await mongoose.connect(process.env.MONGO_URI_MAIN);

    const Invoice = require('../models/Invoice');
    const invoices = await Invoice.find({ companyId: '6a79be9dcd194fb3296bf7dd' })
        .select('invoice_no type_of_invoice remarks items.description items.category items.qty')
        .lean();

    console.log(JSON.stringify(invoices, null, 2));

    await mongoose.disconnect();
}

run().catch((e) => { console.error(e); process.exit(1); });
