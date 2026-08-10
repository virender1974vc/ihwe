const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const Estimate = require('../models/Estimate');
const Company = require('../models/Company');
const CrmEvent = require('../models/CrmEvent');
const ExhibitorRegistration = require('../models/ExhibitorRegistration');
const exhibitorRegistrationService = require('../services/exhibitorRegistrationService');

const isLive = process.argv.includes('--live');

(async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI_MAIN);
        console.log(`Connected to MongoDB. Mode: ${isLive ? 'LIVE (will create/link records)' : 'DRY RUN (no writes)'}\n`);

        const estimates = await Estimate.find({}).lean();
        console.log(`Total Estimates (Proforma Invoices): ${estimates.length}`);

        let alreadyLinked = 0;
        let noCompanyId = 0;
        let companyMissing = 0;
        let noResolvableEvent = 0;
        let eligible = [];

        for (const estimate of estimates) {
            if (estimate.exhibitorRegistrationId) { alreadyLinked++; continue; }
            if (!estimate.companyId) { noCompanyId++; continue; }

            const company = await Company.findById(estimate.companyId).select('_id companyName').lean();
            if (!company) { companyMissing++; continue; }

            let eventId = estimate.eventId || null;
            let eventLabel = 'estimate.eventId';
            if (!eventId && estimate.crmEventId) {
                const crmEvent = await CrmEvent.findById(estimate.crmEventId).select('registrationEventId event_name').lean();
                eventId = crmEvent?.registrationEventId || null;
                eventLabel = `crmEventId(${crmEvent?.event_name || estimate.crmEventId}) -> registrationEventId`;
            }
            if (!eventId) { noResolvableEvent++; continue; }

            eligible.push({ estimateId: estimate._id, est_no: estimate.est_no, companyId: company._id, companyName: company.companyName, eventId, eventLabel });
        }

        console.log(`\n--- Summary ---`);
        console.log(`Already linked (has exhibitorRegistrationId): ${alreadyLinked}`);
        console.log(`Skipped — no companyId: ${noCompanyId}`);
        console.log(`Skipped — companyId doesn't resolve to a Company: ${companyMissing}`);
        console.log(`Skipped — no resolvable eventId (neither eventId nor crmEventId->registrationEventId): ${noResolvableEvent}`);
        console.log(`Eligible for backfill: ${eligible.length}`);

        if (eligible.length > 0) {
            console.log(`\n--- Eligible Estimates ---`);
            eligible.forEach(e => console.log(`  ${e.est_no} — ${e.companyName} (company ${e.companyId}) via ${e.eventLabel}`));
        }

        if (!isLive) {
            console.log(`\nDry run complete — no records were created or linked. Re-run with --live to actually apply.`);
            process.exit(0);
        }

        console.log(`\n--- Creating/linking registrations ---`);
        let created = 0;
        let linked = 0;
        let failed = 0;
        for (const e of eligible) {
            try {
                const estimateDoc = await Estimate.findById(e.estimateId);
                const beforeCount = await ExhibitorRegistration.countDocuments({ eventId: e.eventId, clientId: String(e.companyId) });
                const result = await exhibitorRegistrationService.createOrLinkExhibitorRegistrationForEstimate(estimateDoc);
                if (result) {
                    if (beforeCount > 0) {
                        linked++;
                        console.log(`  Linked ${e.est_no} -> existing ${result.registrationId} (${e.companyName})`);
                    } else {
                        created++;
                        console.log(`  Created ${result.registrationId} for ${e.companyName} (${e.est_no})`);
                    }
                } else {
                    console.log(`  Skipped (already linked by the time we got to it) — ${e.est_no}`);
                }
            } catch (err) {
                failed++;
                console.error(`  FAILED for ${e.companyName} (${e.est_no}):`, err.message);
            }
        }

        console.log(`\n--- Done ---`);
        console.log(`New registrations created: ${created}`);
        console.log(`Estimates linked to an existing registration: ${linked}`);
        console.log(`Failed: ${failed}`);

        process.exit(0);
    } catch (err) {
        console.error('Backfill script failed:', err);
        process.exit(1);
    }
})();
