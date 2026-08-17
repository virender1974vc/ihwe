require('dotenv').config();
const mongoose = require('mongoose');

async function run() {
    await mongoose.connect(process.env.MONGO_URI_MAIN);

    require('../models/Event');
    const Invoice = require('../models/Invoice');
    const ExhibitorRegistration = require('../models/ExhibitorRegistration');
    const Company = require('../models/Company');

    const invoice = await Invoice.findOne({ invoice_no: 'NGW/INV/26-27/002' }).lean();
    console.log('--- Invoice ---');
    console.log(JSON.stringify({
        _id: invoice?._id, invoice_no: invoice?.invoice_no, companyId: invoice?.companyId,
        finalAmount: invoice?.finalAmount, status: invoice?.status,
    }, null, 2));

    if (!invoice) { await mongoose.disconnect(); return; }

    console.log('\n--- Company ---');
    const company = await Company.findById(invoice.companyId).lean();
    console.log(JSON.stringify({
        _id: company?._id, companyName: company?.companyName,
        exhibitorRegistrationId: company?.exhibitorRegistrationId,
        contacts: (company?.contacts || []).map(c => ({ email: c.email, mobile: c.mobile, isPrimary: c.isPrimary })),
    }, null, 2));

    console.log('\n--- ExhibitorRegistration by _id == companyId ---');
    const regByCompanyId = await ExhibitorRegistration.findById(invoice.companyId).lean();
    console.log(regByCompanyId ? JSON.stringify({ _id: regByCompanyId._id, exhibitorName: regByCompanyId.exhibitorName, balanceAmount: regByCompanyId.balanceAmount, clientId: regByCompanyId.clientId }, null, 2) : 'NOT FOUND');

    console.log('\n--- ExhibitorRegistration by clientId == companyId ---');
    const regByClientId = await ExhibitorRegistration.findOne({ clientId: invoice.companyId }).lean();
    console.log(regByClientId ? JSON.stringify({ _id: regByClientId._id, exhibitorName: regByClientId.exhibitorName, balanceAmount: regByClientId.balanceAmount, clientId: regByClientId.clientId, contact1: regByClientId.contact1 }, null, 2) : 'NOT FOUND');

    if (company?.exhibitorRegistrationId) {
        console.log('\n--- ExhibitorRegistration via company.exhibitorRegistrationId ---');
        const regLinked = await ExhibitorRegistration.findById(company.exhibitorRegistrationId).lean();
        console.log(regLinked ? JSON.stringify({ _id: regLinked._id, exhibitorName: regLinked.exhibitorName, balanceAmount: regLinked.balanceAmount, amountPaid: regLinked.amountPaid, contact1: regLinked.contact1 }, null, 2) : 'NOT FOUND');
    }

    await mongoose.disconnect();
}

run().catch((e) => { console.error(e); process.exit(1); });
