const mongoose = require('mongoose');
require('dotenv').config();
const { syncExhibitorFromAccountPayments } = require('../controllers/paymentController');
const ExhibitorRegistration = require('../models/ExhibitorRegistration');

async function run() {
  await mongoose.connect(process.env.MONGO_URI || process.env.MONGO_URI_MAIN);
  console.log('Connected\n');

  const companyId = '6a69f6a0928ebb170e9a5b7b'; // DC Infinity
  await syncExhibitorFromAccountPayments(companyId);

  const reg = await ExhibitorRegistration.findById('6a69f7b3928ebb170e9a5d70').lean();
  console.log('amountPaid:', reg.amountPaid);
  console.log('balanceAmount:', reg.balanceAmount);
  console.log('totalPayable:', reg.totalPayable);
  console.log('paymentHistory count:', (reg.paymentHistory || []).length);
  (reg.paymentHistory || []).forEach((p, i) => console.log(`  [${i}] amount=${p.amount} accountPaymentId=${p.accountPaymentId || 'NONE'}`));

  await mongoose.disconnect();
  console.log('\nDone');
}

run().catch((e) => { console.error(e); process.exit(1); });
