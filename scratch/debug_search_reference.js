require('dotenv').config();
const mongoose = require('mongoose');

const { searchReference } = require('../controllers/paymentAdjustmentController');

async function call(query) {
    const req = { query };
    let payload = null;
    const res = {
        status(code) { this._code = code; return this; },
        json(obj) { payload = obj; return this; },
    };
    await searchReference(req, res);
    return payload;
}

async function run() {
    await mongoose.connect(process.env.MONGO_URI_MAIN);

    console.log('invoice no query:', JSON.stringify(await call({ type: 'against_invoice', q: '002' })));
    console.log('invoice empty query:', JSON.stringify(await call({ type: 'against_invoice', q: '' })).slice(0, 400));
    console.log('estimate company query:', JSON.stringify(await call({ type: 'against_estimate', q: 'Mama' })).slice(0, 400));
    console.log('creditnote query:', JSON.stringify(await call({ type: 'against_credit_note', q: 'a' })).slice(0, 400));
    console.log('bad type:', JSON.stringify(await call({ type: 'bogus', q: '' })));

    await mongoose.disconnect();
}

run().catch((e) => { console.error(e); process.exit(1); });
