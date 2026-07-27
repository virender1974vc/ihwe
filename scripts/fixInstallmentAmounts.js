/**
 * One-time fix script: Recalculate installment dueAmounts for existing registrations
 * Run: node scripts/fixInstallmentAmounts.js
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const ExhibitorRegistration = require('../models/ExhibitorRegistration');

async function fixInstallments() {
    await mongoose.connect(process.env.MONGO_URI_MAIN || process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    const registrations = await ExhibitorRegistration.find({
        'installments.0': { $exists: true }
    }).select('registrationId exhibitorName installments financeBreakdown participation amountPaid balanceAmount');

    console.log(`Found ${registrations.length} registrations with installments\n`);

    let fixed = 0;
    let skipped = 0;

    for (const reg of registrations) {
        const netPayable = reg.financeBreakdown?.netPayable || reg.participation?.total || 0;
        if (!netPayable) { skipped++; continue; }

        const insts = reg.installments;
        if (!insts || insts.length === 0) { skipped++; continue; }

        // Sort by installmentNumber ascending
        const sorted = [...insts].sort((a, b) => a.installmentNumber - b.installmentNumber);

        // Recalculate: last phase gets exact remaining, others use cumulative approach
        let cumulativeAssigned = 0;
        const newAmounts = sorted.map((inst, idx) => {
            const isLast = idx === sorted.length - 1;
            if (isLast) {
                return netPayable - cumulativeAssigned;
            }
            const thisPct = Number(inst.percentage);
            const cumulativeTarget = Math.round(netPayable * thisPct / 100);
            const amount = cumulativeTarget - cumulativeAssigned;
            cumulativeAssigned = cumulativeTarget;
            return amount;
        });

        console.log(`\n📋 ${reg.registrationId} — ${reg.exhibitorName}`);
        console.log(`   netPayable: ₹${netPayable}`);
        console.log(`   New amounts: ${newAmounts.map((a, i) => `Phase${i+1}=₹${a}`).join(', ')}`);
        console.log(`   New sum: ₹${newAmounts.reduce((s, a) => s + a, 0)}`);

        // Apply new dueAmounts — preserve paid status and paidAmount
        for (let i = 0; i < sorted.length; i++) {
            const inst = reg.installments.find(x => x.installmentNumber === sorted[i].installmentNumber);
            if (inst) {
                inst.dueAmount = newAmounts[i];
                // Re-evaluate status based on new dueAmount
                if (inst.paidAmount >= inst.dueAmount && inst.paidAmount > 0) {
                    inst.status = 'paid';
                } else if (inst.paidAmount > 0) {
                    inst.status = 'partial';
                }
                // else keep existing status (pending/paid)
            }
        }

        await reg.save();
        fixed++;
        console.log(`   ✅ Fixed`);
    }

    console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`✅ Fixed: ${fixed} registrations`);
    console.log(`⏭️  Skipped: ${skipped}`);

    await mongoose.disconnect();
    console.log('Done!');
}

fixInstallments().catch(err => {
    console.error('❌ Error:', err);
    process.exit(1);
});
