const mongoose = require('mongoose');
require('dotenv').config();
const Counter = require('../models/visitor/CounterModel');

async function run() {
  await mongoose.connect(process.env.MONGO_URI || process.env.MONGO_URI_MAIN);
  console.log('Connected\n');

  const year = new Date().getFullYear();
  const type = `exhibitor-v2-${year}`;

  const before = await Counter.findOne({ type }).lean();
  console.log('Before:', before);

  const after = await Counter.findOneAndUpdate(
    { type },
    { $set: { seq: 8000 } },
    { upsert: true, returnDocument: 'after' }
  );
  console.log('After:', after.toObject());
  console.log(`\nNext ExhibitorRegistration created will be 9IHWE-EX-${year}-8001`);

  await mongoose.disconnect();
  console.log('\nDone');
}

run().catch((e) => { console.error(e); process.exit(1); });
