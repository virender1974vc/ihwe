require('dotenv').config({ quiet: true });
const mongoose = require('mongoose');
const Company = require('../models/Company');
const CrmEvent = require('../models/CrmEvent');

const apply = process.argv.includes('--apply');
const rollback = process.argv.includes('--rollback');
const MIGRATION_KEY = 'company-exhibition-lifecycle-v1';
const Backup = mongoose.model(
  'CompanyExhibitionLifecycleMigrationBackup',
  new mongoose.Schema({
    migrationKey: { type: String, index: true },
    companyId: { type: mongoose.Schema.Types.ObjectId, index: true },
    snapshot: mongoose.Schema.Types.Mixed,
    createdAt: { type: Date, default: Date.now },
  }, { collection: 'company_exhibition_lifecycle_migration_backups' }),
);
const normalized = (value) => String(value || '').trim().toLowerCase();

const pickCrmEvent = (company, crmEvents) => {
  const name = normalized(company.eventName);
  if (!name) return null;
  const exact = crmEvents.find((event) =>
    [event.event_name, event.event_fullName].some((value) => normalized(value) === name),
  );
  if (exact) return exact;
  if (name.includes('ihwe')) {
    return crmEvents.find((event) =>
      normalized(event.event_name).includes('ihwe') || normalized(event.event_fullName).includes('ihwe'),
    ) || null;
  }
  if (name.includes('organic')) {
    const organicEvents = crmEvents
      .filter((event) =>
        normalized(event.event_name).includes('organic') || normalized(event.event_fullName).includes('organic'),
      )
      .sort((a, b) => new Date(a.event_fromDate) - new Date(b.event_fromDate));
    return organicEvents[0] || null;
  }
  return null;
};

(async () => {
  await mongoose.connect(process.env.MONGO_URI_MAIN);
  if (rollback) {
    const backups = Backup.find({ migrationKey: MIGRATION_KEY }).cursor();
    let restored = 0;
    for await (const backup of backups) {
      const snapshot = backup.snapshot || {};
      const update = { $set: {}, $unset: {} };
      ['eventId', 'events', 'eventAssignments'].forEach((field) => {
        if (snapshot[`has_${field}`]) update.$set[field] = snapshot[field];
        else update.$unset[field] = 1;
      });
      if (Object.keys(update.$set).length === 0) delete update.$set;
      if (Object.keys(update.$unset).length === 0) delete update.$unset;
      await Company.updateOne({ _id: backup.companyId }, update);
      restored += 1;
    }
    console.log(JSON.stringify({ mode: 'rollback', restored }, null, 2));
    await mongoose.disconnect();
    return;
  }
  const crmEvents = await CrmEvent.find({}).lean();

  const cursor = Company.find({}).cursor();
  const report = {
    mode: apply ? 'apply' : 'dry-run',
    checked: 0,
    assignmentsToCreate: 0,
    nameMapped: 0,
    unmapped: 0,
  };

  for await (const company of cursor) {
    report.checked += 1;
    const eventIds = new Set([
      ...(company.eventId ? [String(company.eventId)] : []),
      ...(company.events || []).map(String),
      ...(company.eventAssignments || []).map((item) => String(item.eventId)),
    ].filter(Boolean));

    if (eventIds.size === 0) {
      const mapped = pickCrmEvent(company, crmEvents);
      if (mapped) {
        eventIds.add(String(mapped._id));
        report.nameMapped += 1;
      } else {
        report.unmapped += 1;
      }
    }

    const existing = new Set((company.eventAssignments || []).map((item) => String(item.eventId)));
    const missing = [...eventIds].filter((eventId) => !existing.has(eventId));
    report.assignmentsToCreate += missing.length;
    if (!apply || missing.length === 0) continue;

    await Backup.updateOne(
      { migrationKey: MIGRATION_KEY, companyId: company._id },
      {
        $setOnInsert: {
          migrationKey: MIGRATION_KEY,
          companyId: company._id,
          snapshot: {
            has_eventId: company.eventId !== undefined,
            eventId: company.eventId || null,
            has_events: company.events !== undefined,
            events: company.events || [],
            has_eventAssignments: company.eventAssignments !== undefined,
            eventAssignments: company.eventAssignments || [],
          },
          createdAt: new Date(),
        },
      },
      { upsert: true },
    );
    await Company.updateOne(
      { _id: company._id },
      {
        $addToSet: { events: { $each: [...eventIds] } },
        $push: {
          eventAssignments: {
            $each: missing.map((eventId) => ({
              eventId,
              status: company.companyStatus || 'New Lead',
              forwardTo: company.forwardTo || '',
              dataSource: company.dataSource || '',
              socialMediaType: company.socialMediaType || '',
              referralName: company.referralName || '',
              referralMobile: company.referralMobile || '',
              reminder: company.reminder || null,
              followUpDate: company.followUpDate || null,
              exhibitorRegistrationId: company.exhibitorRegistrationId || null,
              updatedAt: new Date(),
            })),
          },
        },
      },
    );
  }

  console.log(JSON.stringify(report, null, 2));
  await mongoose.disconnect();
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
