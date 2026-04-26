/**
 * Direct fix for registration 9IHWE-EX-2026-8033
 * Sets Phase 3 dueAmount = actual remaining balance
 * Run: node scripts/fixPhase3.js
 */
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const ExhibitorRegistration = require('../models/ExhibitorRegistration');

async function fix() {
    await mongoose.connect(process.env.MONGO_URI_MAIN || process.env.MONGO_URI);
    console.log('✅ Connected');

    // Find all registrations with installments
    const regs = await ExhibitorRegistration.find({ 'installments.0': { $exists: true } })
        .select('registrationId exhibitorName installments financeBreakdown participation amountPaid balanceAmount');

    for (const reg of regs) {
        const netPayable = reg.financeBreakdown?.netPayable || reg.participation?.total || 0;
        if (!netPayable) continue;

        const sorted = [...reg.installments].sort((a, b) => a.installmentNumber - b.installmentNumber);

        // Total already paid across all installments
        const totalPaidInInstallments = sorted.reduce((s, i) => s + (i.paidAmount || 0), 0);
        
        // What's actually remaining
        const actualRemaining = Math.max(0, netPayable - totalPaidInInstallments);

        // Find unpaid installments
        const unpaidInsts = sorted.filter(i => i.status !== 'paid');
        
        console.log(`\n📋 ${reg.registrationId} — ${reg.exhibitorName}`);
        console.log(`   netPayable: ₹${netPayable}`);
        console.log(`   totalPaidInInstallments: ₹${totalPaidInInstallments}`);
        console.log(`   actualRemaining: ₹${actualRemaining}`);
        console.log(`   unpaid phases: ${unpaidInsts.length}`);

        if (unpaidInsts.length === 0) {
            console.log(`   ✅ All paid, skipping`);
            continue;
        }

        if (unpaidInsts.length === 1) {
            // Only one unpaid phase — set its dueAmount = exact remaining balance
            const lastInst = reg.installments.find(i => i.installmentNumber === unpaidInsts[0].installmentNumber);
            if (lastInst) {
                console.log(`   Fixing Phase ${lastInst.installmentNumber}: ₹${lastInst.dueAmount} → ₹${actualRemaining}`);
                lastInst.dueAmount = actualRemaining;
                lastInst.paidAmount = lastInst.paidAmount || 0;
                if (lastInst.paidAmount >= lastInst.dueAmount && lastInst.paidAmount > 0) {
                    lastInst.status = 'paid';
                } else {
                    lastInst.status = 'pending';
                }
            }
        } else {
            // Multiple unpaid — recalculate slice % for unpaid ones
            // Paid phases keep their paidAmount, unpaid get slice of remaining
            const paidPct = sorted
                .filter(i => i.status === 'paid')
                .reduce((s, i) => s + Number(i.percentage), 0);
            
            let runningAssigned = 0;
            for (let i = 0; i < unpaidInsts.length; i++) {
                const inst = reg.installments.find(x => x.installmentNumber === unpaidInsts[i].installmentNumber);
                if (!inst) continue;
                
                const thisPct = Number(inst.percentage);
                const prevPct = i === 0 ? paidPct : Number(unpaidInsts[i-1].percentage);
                const slicePct = thisPct - prevPct;
                
                let amount;
                if (i === unpaidInsts.length - 1) {
                    // Last unpaid gets exact remainder
                    amount = actualRemaining - runningAssigned;
                } else {
                    amount = Math.round(netPayable * slicePct / 100);
                    runningAssigned += amount;
                }
                
                console.log(`   Fixing Phase ${inst.installmentNumber}: ₹${inst.dueAmount} → ₹${amount}`);
                inst.dueAmount = amount;
                inst.status = 'pending';
            }
        }

        // Also fix overall amountPaid and balanceAmount
        reg.amountPaid = totalPaidInInstallments;
        reg.balanceAmount = actualRemaining;
        reg.totalPayable = actualRemaining + (reg.penaltyAmount || 0);

        await reg.save();
        console.log(`   ✅ Saved`);
    }

    await mongoose.disconnect();
    console.log('\nDone!');
}

fix().catch(err => { console.error('❌', err); process.exit(1); });
