// Backfills the flat Company.exhibitorRegistrationId pointer for companies
// where it's missing but a real exhibitor registration can be resolved —
// via eventAssignments[].exhibitorRegistrationId, or a reverse
// ExhibitorRegistration.clientId lookup. This field is read all over the
// codebase (invoices, estimates, payments, delivery challans, MSME PMS, ...)
// as the shortcut to "the exhibitor registration for this company"; it was
// never populated for event-scoped "Book a Stand" bookings until the
// exhibitorRegistrationService.js fix, so this catches up existing data.
//
// Usage:
//   node scripts/backfillCompanyExhibitorRegistrationId.js            (dry run)
//   node scripts/backfillCompanyExhibitorRegistrationId.js --apply    (writes)
//   node scripts/backfillCompanyExhibitorRegistrationId.js --rollback (restores pre-migration values)

require('dotenv').config({ quiet: true });
const mongoose = require('mongoose');
const Company = require('../models/Company');
const ExhibitorRegistration = require('../models/ExhibitorRegistration');

const apply = process.argv.includes('--apply');
const rollback = process.argv.includes('--rollback');
const MIGRATION_KEY = 'company-exhibitor-registration-id-backfill-v1';
const Backup = mongoose.model(
  'CompanyExhibitorRegistrationIdBackfillBackup',
  new mongoose.Schema({
    migrationKey: { type: String, index: true },
    companyId: { type: mongoose.Schema.Types.ObjectId, index: true },
    previousValue: { type: String, default: null },
    createdAt: { type: Date, default: Date.now },
  }, { collection: 'company_exhibitor_registration_id_backfill_backups' }),
);

// A payment-failed registration shouldn't win over a genuinely active one
// when a company has more than one candidate.
const STATUS_RANK = {
  'confirmed': 0, 'paid': 0, 'advance-paid': 0, 'approved': 0,
  'pending': 1,
  'payment-failed': 2, 'rejected': 2,
};
const rankOf = (reg) => STATUS_RANK[reg.status] ?? 1;

const pickBest = (regs) => {
  if (regs.length === 0) return null;
  return regs.slice().sort((a, b) => {
    const rankDiff = rankOf(a) - rankOf(b);
    if (rankDiff !== 0) return rankDiff;
    return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
  })[0];
};

(async () => {
  await mongoose.connect(process.env.MONGO_URI_MAIN);

  if (rollback) {
    const backups = Backup.find({ migrationKey: MIGRATION_KEY }).cursor();
    let restored = 0;
    for await (const backup of backups) {
      await Company.updateOne(
        { _id: backup.companyId },
        { $set: { exhibitorRegistrationId: backup.previousValue } },
      );
      restored += 1;
    }
    console.log(JSON.stringify({ mode: 'rollback', restored }, null, 2));
    await mongoose.disconnect();
    return;
  }

  const report = {
    mode: apply ? 'apply' : 'dry-run',
    checked: 0,
    alreadySet: 0,
    resolved: 0,
    resolvedViaEventAssignments: 0,
    resolvedViaClientIdOnly: 0,
    ambiguousResolvedByRank: 0,
    unresolved: 0,
  };

  const cursor = Company.find({}).cursor();
  for await (const company of cursor) {
    report.checked += 1;
    if (company.exhibitorRegistrationId) {
      report.alreadySet += 1;
      continue;
    }

    const assignmentIds = [...new Set(
      (company.eventAssignments || [])
        .map((a) => a.exhibitorRegistrationId)
        .filter(Boolean)
        .map(String),
    )];

    const [byAssignment, byClientId] = await Promise.all([
      assignmentIds.length
        ? ExhibitorRegistration.find({ _id: { $in: assignmentIds } }).select('status createdAt').lean()
        : Promise.resolve([]),
      ExhibitorRegistration.find({ clientId: String(company._id) }).select('status createdAt').lean(),
    ]);

    const candidatesById = new Map();
    [...byAssignment, ...byClientId].forEach((reg) => candidatesById.set(String(reg._id), reg));
    const candidates = [...candidatesById.values()];

    if (candidates.length === 0) {
      report.unresolved += 1;
      continue;
    }

    const best = pickBest(candidates);
    report.resolved += 1;
    if (candidates.length > 1) report.ambiguousResolvedByRank += 1;
    else if (assignmentIds.includes(String(best._id))) report.resolvedViaEventAssignments += 1;
    else report.resolvedViaClientIdOnly += 1;

    if (!apply) continue;

    await Backup.updateOne(
      { migrationKey: MIGRATION_KEY, companyId: company._id },
      { $setOnInsert: { migrationKey: MIGRATION_KEY, companyId: company._id, previousValue: company.exhibitorRegistrationId || null, createdAt: new Date() } },
      { upsert: true },
    );
    await Company.updateOne(
      { _id: company._id },
      { $set: { exhibitorRegistrationId: String(best._id) } },
    );
  }

  console.log(JSON.stringify(report, null, 2));
  await mongoose.disconnect();
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
