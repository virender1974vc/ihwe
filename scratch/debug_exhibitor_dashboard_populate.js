require('dotenv').config();
const mongoose = require('mongoose');

async function run() {
    await mongoose.connect(process.env.MONGO_URI_MAIN);

    require('../models/Event');
    const ExhibitorRegistration = require('../models/ExhibitorRegistration');

    const reg = await ExhibitorRegistration.findOne({ balanceAmount: { $gt: 0 } })
        .populate('eventId', 'name date location venue startDate endDate setupDate dismantlingDate paymentPlans')
        .lean();

    if (!reg) {
        console.log('No exhibitor registration with balanceAmount > 0 found.');
    } else {
        console.log('exhibitor:', reg.exhibitorName || reg._id);
        console.log('balanceAmount:', reg.balanceAmount);
        console.log('installments:', JSON.stringify((reg.installments || []).map(i => ({ status: i.status, planId: i.planId, dueAmount: i.dueAmount, paidAmount: i.paidAmount, dueDate: i.dueDate })), null, 2));
        console.log('event.startDate:', reg.eventId?.startDate);
        console.log('event.paymentPlans:', JSON.stringify(reg.eventId?.paymentPlans, null, 2));
    }

    await mongoose.disconnect();
}

run().catch((e) => { console.error(e); process.exit(1); });
