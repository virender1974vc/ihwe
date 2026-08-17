require('dotenv').config();
const mongoose = require('mongoose');

const { getPaymentAdjustments } = require('../controllers/paymentAdjustmentController');

async function run() {
    await mongoose.connect(process.env.MONGO_URI_MAIN);

    const req = { query: {} };
    let payload = null;
    const res = {
        status(code) { this._code = code; return this; },
        json(obj) { payload = obj; return this; },
    };

    await getPaymentAdjustments(req, res);
    console.log(JSON.stringify(payload, null, 2));

    await mongoose.disconnect();
}

run().catch((e) => { console.error(e); process.exit(1); });
