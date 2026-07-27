const mongoose = require('mongoose');
require('dotenv').config();
const Company = require('../models/Company');
const CrmState = require('../models/CrmState');
const CrmCity = require('../models/CrmCity');

/**
 * A bulk import left `Company.state` / `Company.city` holding raw
 * CrmState.stateCode / CrmCity.cityCode numbers (e.g. state: "38") instead of
 * names (e.g. "Uttar Pradesh"). This resolves every numeric-looking state/city
 * against the CrmState/CrmCity reference lists and overwrites it with the
 * proper name. Non-numeric values (already a name) are left untouched.
 */
const DRY_RUN = process.argv.includes('--dry-run');

async function migrateStateCityCodesToNames() {
  await mongoose.connect(process.env.MONGO_URI_MAIN);
  console.log(`Connected to MongoDB${DRY_RUN ? ' (DRY RUN — no writes will be made)' : ''}\n`);

  const states = await CrmState.find({}).select('stateCode name').lean();
  const cities = await CrmCity.find({}).select('cityCode name').lean();
  const stateMap = new Map(states.map((s) => [String(s.stateCode), s.name]));
  const cityMap = new Map(cities.map((c) => [String(c.cityCode), c.name]));
  console.log(`Loaded ${stateMap.size} states, ${cityMap.size} cities\n`);

  const isNumeric = (v) => typeof v === 'string' && /^\d+$/.test(v.trim());

  const cursor = Company.find({
    $or: [{ state: { $regex: /^\d+$/ } }, { city: { $regex: /^\d+$/ } }],
  })
    .select('_id state city')
    .lean()
    .cursor();

  let scanned = 0;
  let updated = 0;
  let unresolvedState = 0;
  let unresolvedCity = 0;
  let ops = [];

  const flush = async () => {
    if (ops.length === 0) return;
    if (!DRY_RUN) await Company.bulkWrite(ops, { ordered: false });
    ops = [];
  };

  for await (const doc of cursor) {
    scanned++;
    const set = {};

    if (isNumeric(doc.state)) {
      const name = stateMap.get(doc.state.trim());
      if (name) set.state = name;
      else unresolvedState++;
    }
    if (isNumeric(doc.city)) {
      const name = cityMap.get(doc.city.trim());
      if (name) set.city = name;
      else unresolvedCity++;
    }

    if (Object.keys(set).length > 0) {
      ops.push({ updateOne: { filter: { _id: doc._id }, update: { $set: set } } });
      updated++;
    }

    if (ops.length >= 500) await flush();
  }
  await flush();

  console.log('--- Migration summary ---');
  console.log('Companies scanned (numeric state or city):', scanned);
  console.log('Companies updated:', updated);
  console.log('State codes with no CrmState match:', unresolvedState);
  console.log('City codes with no CrmCity match:', unresolvedCity);

  await mongoose.disconnect();
}

migrateStateCityCodesToNames()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Migration failed:', err);
    process.exit(1);
  });
