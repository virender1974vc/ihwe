/**
 * MongoDB Performance Indexes Script
 * Run: node scripts/addIndexes.js
 * 
 * This adds database indexes on the most frequently queried fields.
 * Run this ONCE on the VPS. It will create indexes in the background
 * so it won't block existing queries.
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');

async function addIndexes() {
  console.log('🔌 Connecting to MongoDB...');
  await mongoose.connect(process.env.MONGO_URI_MAIN, { serverSelectionTimeoutMS: 15000 });
  console.log('✅ Connected\n');

  const db = mongoose.connection.db;

  const indexJobs = [
    // ── Companies Collection (most queried in dashboard)
    {
      col: 'companies',
      indexes: [
        { spec: { forwardTo: 1 },        opts: { background: true, name: 'idx_forwardTo' } },
        { spec: { added_by: 1 },         opts: { background: true, name: 'idx_added_by' } },
        { spec: { companyStatus: 1 },    opts: { background: true, name: 'idx_companyStatus' } },
        { spec: { createdAt: -1 },       opts: { background: true, name: 'idx_createdAt_desc' } },
        // Compound: most dashboard queries filter by forwardTo + sort by createdAt
        { spec: { forwardTo: 1, createdAt: -1 }, opts: { background: true, name: 'idx_forwardTo_createdAt' } },
      ]
    },
    // ── ExhibitorRegistrations Collection
    {
      col: 'exhibitorregistrations',
      indexes: [
        { spec: { status: 1 },           opts: { background: true, name: 'idx_status' } },
        { spec: { createdAt: -1 },       opts: { background: true, name: 'idx_createdAt_desc' } },
        { spec: { status: 1, createdAt: -1 }, opts: { background: true, name: 'idx_status_createdAt' } },
      ]
    },
    // ── ActivityLogs Collection (used in dashboard Recent Activities)
    {
      col: 'activitylogs',
      indexes: [
        { spec: { createdAt: -1 },       opts: { background: true, name: 'idx_createdAt_desc' } },
      ]
    },
    // ── CrmExhibatorReview2023 (used in ConfirmClientList)
    {
      col: 'crmexhibatorreviews2023s',
      indexes: [
        { spec: { cmpny_id: 1 },         opts: { background: true, name: 'idx_cmpny_id' } },
        { spec: { createdAt: -1 },       opts: { background: true, name: 'idx_createdAt_desc' } },
      ]
    },
    // ── Users (admin lookup on every non-superadmin company fetch)
    {
      col: 'users',
      indexes: [
        { spec: { username: 1 },         opts: { background: true, name: 'idx_username', unique: false } },
      ]
    },
  ];

  let total = 0;
  let created = 0;

  for (const job of indexJobs) {
    const col = db.collection(job.col);
    console.log(`\n📦 Collection: ${job.col}`);

    for (const idx of job.indexes) {
      total++;
      try {
        const existing = await col.indexExists(idx.opts.name);
        if (existing) {
          console.log(`  ⏭️  Already exists: ${idx.opts.name}`);
          continue;
        }
        await col.createIndex(idx.spec, idx.opts);
        console.log(`  ✅ Created: ${idx.opts.name}`);
        created++;
      } catch (err) {
        console.error(`  ❌ Failed ${idx.opts.name}:`, err.message);
      }
    }
  }

  console.log(`\n🎉 Done! ${created} new indexes created out of ${total} total.`);
  await mongoose.disconnect();
  process.exit(0);
}

addIndexes().catch(err => {
  console.error('❌ Script failed:', err.message);
  process.exit(1);
});
