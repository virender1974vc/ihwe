// Backfills billing_city (and, defensively, billing_address/billing_state/
// billing_pincode if any legacy invoice is missing them) on existing
// Invoice documents. billing_city is a brand-new field — no invoice created
// before this fix has it set, so the "Client Name & Address" box would keep
// falling through to the older company_addr/city/state fields or the live
// Company profile for every invoice already in the database.
//
// Resolution order per field: the invoice's own already-correct generic
// field (city/state/pincode/company_addr) -> the linked source estimate's
// same field (via source_estimate_id) -> the linked Company's same field.
//
// Usage:
//   node scripts/backfillInvoiceBillingCity.js            (dry run)
//   node scripts/backfillInvoiceBillingCity.js --apply    (writes)
//   node scripts/backfillInvoiceBillingCity.js --rollback (restores pre-migration values)

require('dotenv').config({ quiet: true });
const mongoose = require('mongoose');
const Invoice = require('../models/Invoice');
const Estimate = require('../models/Estimate');
const Company = require('../models/Company');

const apply = process.argv.includes('--apply');
const rollback = process.argv.includes('--rollback');
const MIGRATION_KEY = 'invoice-billing-city-backfill-v1';
const Backup = mongoose.model(
  'InvoiceBillingCityBackfillBackup',
  new mongoose.Schema({
    migrationKey: { type: String, index: true },
    invoiceId: { type: mongoose.Schema.Types.ObjectId, index: true },
    previousValues: mongoose.Schema.Types.Mixed,
    createdAt: { type: Date, default: Date.now },
  }, { collection: 'invoice_billing_city_backfill_backups' }),
);

const clean = (v) => (v && String(v).trim()) || '';

(async () => {
  await mongoose.connect(process.env.MONGO_URI_MAIN);

  if (rollback) {
    const backups = Backup.find({ migrationKey: MIGRATION_KEY }).cursor();
    let restored = 0;
    for await (const backup of backups) {
      await Invoice.updateOne({ _id: backup.invoiceId }, { $set: backup.previousValues });
      restored += 1;
    }
    console.log(JSON.stringify({ mode: 'rollback', restored }, null, 2));
    await mongoose.disconnect();
    return;
  }

  const report = { mode: apply ? 'apply' : 'dry-run', checked: 0, alreadyComplete: 0, updated: 0, unresolved: 0 };

  const cursor = Invoice.find({}).select(
    'billing_address billing_city billing_state billing_pincode company_addr city state pincode source_estimate_id companyId'
  ).cursor();

  for await (const inv of cursor) {
    report.checked += 1;
    const needsAddress = !clean(inv.billing_address);
    const needsCity = !clean(inv.billing_city);
    const needsState = !clean(inv.billing_state);
    const needsPincode = !clean(inv.billing_pincode);

    if (!needsAddress && !needsCity && !needsState && !needsPincode) {
      report.alreadyComplete += 1;
      continue;
    }

    let estimate = null;
    let company = null;
    const needsEstimateOrCompanyLookup =
      (needsAddress && !clean(inv.company_addr)) ||
      (needsCity && !clean(inv.city)) ||
      (needsState && !clean(inv.state)) ||
      (needsPincode && !clean(inv.pincode));

    if (needsEstimateOrCompanyLookup) {
      if (inv.source_estimate_id) {
        estimate = await Estimate.findById(inv.source_estimate_id).select('company_addr city state pincode').lean().catch(() => null);
      }
      if (inv.companyId) {
        company = await Company.findById(inv.companyId).select('address city state pincode').lean().catch(() => null);
      }
    }

    const resolvedAddress = clean(inv.company_addr) || clean(estimate?.company_addr) || clean(company?.address);
    const resolvedCity = clean(inv.city) || clean(estimate?.city) || clean(company?.city);
    const resolvedState = clean(inv.state) || clean(estimate?.state) || clean(company?.state);
    const resolvedPincode = clean(inv.pincode) || clean(estimate?.pincode) || clean(company?.pincode);

    const update = {};
    if (needsAddress && resolvedAddress) update.billing_address = resolvedAddress;
    if (needsCity && resolvedCity) update.billing_city = resolvedCity;
    if (needsState && resolvedState) update.billing_state = resolvedState;
    if (needsPincode && resolvedPincode) update.billing_pincode = resolvedPincode;

    if (Object.keys(update).length === 0) {
      report.unresolved += 1;
      continue;
    }

    report.updated += 1;
    if (!apply) continue;

    await Backup.updateOne(
      { migrationKey: MIGRATION_KEY, invoiceId: inv._id },
      {
        $setOnInsert: {
          migrationKey: MIGRATION_KEY,
          invoiceId: inv._id,
          previousValues: {
            billing_address: inv.billing_address ?? null,
            billing_city: inv.billing_city ?? null,
            billing_state: inv.billing_state ?? null,
            billing_pincode: inv.billing_pincode ?? null,
          },
          createdAt: new Date(),
        },
      },
      { upsert: true },
    );
    await Invoice.updateOne({ _id: inv._id }, { $set: update });
  }

  console.log(JSON.stringify(report, null, 2));
  await mongoose.disconnect();
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
