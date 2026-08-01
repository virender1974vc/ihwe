const mongoose = require('mongoose');
require('dotenv').config();
const Counter = require('../models/visitor/CounterModel');

async function run() {
  await mongoose.connect(process.env.MONGO_URI || process.env.MONGO_URI_MAIN);
  const year = new Date().getFullYear();
  const c = await Counter.findOne({ type: `exhibitor-v2-${year}` }).lean();
  console.log('Current counter doc:', c);
  await mongoose.disconnect();
}
run();
