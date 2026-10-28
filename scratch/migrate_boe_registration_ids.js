// One-off: re-issue BOE visitor registration IDs as NGT/BOE/<TYPE>/<YY>/00001...
//
//   node scratch/migrate_boe_registration_ids.js           -> DRY RUN (no writes)
//   node scratch/migrate_boe_registration_ids.js --apply   -> writes to DB
//
// Take a DB backup before --apply. A mapping file (old -> new) is written to
// scratch/boe_id_migration_<timestamp>.json so the change can be reverted.
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const qrcode = require('qrcode');
require('dotenv').config();

const Counter = require('../models/visitor/CounterModel');
const Attendance = require('../models/Attendance');
const AttendanceAudit = require('../models/AttendanceAudit');
const AttendanceScanAttempt = require('../models/AttendanceScanAttempt');

const APPLY = process.argv.includes('--apply');

const TYPES = [
  { type: 'corporate', code: 'CV', model: require('../models/visitor/CorporateVisitorModel') },
  { type: 'general', code: 'GV', model: require('../models/visitor/GeneralVisitorModel') },
  { type: 'healthCamp', code: 'HV', model: require('../models/visitor/FreeHealthCampModel') },
  { type: 'international', code: 'IV', model: require('../models/visitor/InternationalVisitorModel') },
];

const { isBoeEvent: isBoeName } = require('../utils/isBoeEvent');
const isBoeEvent = (v) => isBoeName(`${v.eventName || ''} ${v.registrationFor || ''}`);

async function run() {
  await mongoose.connect(process.env.MONGO_URI || process.env.MONGO_URI_MAIN);
  console.log(APPLY ? 'MODE: APPLY\n' : 'MODE: DRY RUN (pass --apply to write)\n');

  const siteUrl = process.env.SITE_URL ? process.env.SITE_URL.replace(/\/$/, '') : 'https://ihwe.in';
  const mapping = [];

  for (const { type, code, model } of TYPES) {
    // Every BOE record carrying an NGT/IHWE/... or NGT/BOE/... id, oldest first
    const all = await model
      .find({ registrationId: /^NGT\/(IHWE|BOE)\// })
      .sort({ createdAt: 1, _id: 1 })
      .select('registrationId eventName registrationFor createdAt')
      .lean();
    const boe = all.filter(isBoeEvent);

    let seq = 0;
    for (const v of boe) {
      seq += 1;
      const yy = String(new Date(v.createdAt).getFullYear()).slice(-2);
      const newId = `NGT/BOE/${code}/${yy}/${String(seq).padStart(5, '0')}`;
      mapping.push({ type, _id: String(v._id), oldId: v.registrationId, newId });
    }
    console.log(`${type}: ${boe.length} BOE records (of ${all.length} scanned)`);
    if (boe.length) {
      console.log(`  first: ${boe[0].registrationId} -> ${mapping.find((m) => m.type === type).newId}`);
    }
  }

  const file = path.join(__dirname, `boe_id_migration_${Date.now()}.json`);
  fs.writeFileSync(file, JSON.stringify(mapping, null, 2));
  console.log(`\nMapping written: ${file} (${mapping.length} records)`);

  if (!APPLY) {
    console.log('Dry run only. Review the mapping file, then re-run with --apply.');
    return mongoose.disconnect();
  }

  // Safety: new ids must not collide with an id that is NOT being migrated
  for (const { type, model } of TYPES) {
    const ids = mapping.filter((m) => m.type === type).map((m) => m.newId);
    const moving = new Set(mapping.filter((m) => m.type === type).map((m) => m.oldId));
    const clash = (await model.find({ registrationId: { $in: ids } }).select('registrationId').lean())
      .filter((d) => !moving.has(d.registrationId));
    if (clash.length) throw new Error(`${type}: new ids already taken by other records, aborting`);
  }

  for (const m of mapping) {
    const { model } = TYPES.find((t) => t.type === m.type);
    const qrCode = await qrcode.toDataURL(`${siteUrl}/visitor?id=${m.newId}`);
    await model.updateOne({ _id: m._id }, { $set: { registrationId: m.newId, qrCode } });
    for (const A of [Attendance, AttendanceAudit, AttendanceScanAttempt]) {
      await A.updateMany({ registrationId: m.oldId }, { $set: { registrationId: m.newId } });
    }
  }

  // Next BOE registration continues after the last migrated one
  for (const { type } of TYPES) {
    const n = mapping.filter((m) => m.type === type).length;
    await Counter.findOneAndUpdate({ type: `${type}_BOE` }, { $set: { seq: n } }, { upsert: true });
    console.log(`Counter ${type}_BOE -> ${n}`);
  }

  console.log('\nDone');
  await mongoose.disconnect();
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
