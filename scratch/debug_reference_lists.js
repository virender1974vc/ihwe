require('dotenv').config();
const mongoose = require('mongoose');

async function callController(fn, req) {
    let payload = null;
    let statusCode = 200;
    const res = {
        status(code) { statusCode = code; return this; },
        json(obj) { payload = obj; return this; },
    };
    try {
        await fn(req, res);
    } catch (e) {
        return { error: e.message, stack: e.stack };
    }
    return { statusCode, payload: Array.isArray(payload) ? `array(${payload.length})` : payload };
}

async function run() {
    await mongoose.connect(process.env.MONGO_URI_MAIN);

    const invoiceController = require('../controllers/invoiceController');
    const perInvoiceController = require('../controllers/perInvoiceController');
    const estimateController = require('../controllers/estimateController');
    const creditNoteController = require('../controllers/creditNoteController');
    const accountDebitNoteController = require('../controllers/accountDebitNoteController');

    console.log('invoices:', JSON.stringify(await callController(invoiceController.getAllInvoices, { query: {} })).slice(0, 300));
    console.log('perinvoice:', JSON.stringify(await callController(perInvoiceController.getAllPerformaInvoices, { query: {} })).slice(0, 300));
    console.log('estimates:', JSON.stringify(await callController(estimateController.getAllEstimates, { query: {} })).slice(0, 300));
    console.log('creditnotes:', JSON.stringify(await callController(creditNoteController.getCreditNotes, { query: {} })).slice(0, 300));
    console.log('account-debit-notes:', JSON.stringify(await callController(accountDebitNoteController.getAccountDebitNotes, { query: {} })).slice(0, 300));

    await mongoose.disconnect();
}

run().catch((e) => { console.error(e); process.exit(1); });
