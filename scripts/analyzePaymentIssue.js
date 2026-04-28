const mongoose = require('mongoose');
const ExhibitorRegistration = require('../models/ExhibitorRegistration');
require('dotenv').config();

/**
 * Detailed Analysis of Payment Issue
 * This will help understand exactly what's happening
 */

async function analyzePaymentIssue() {
    try {
        await mongoose.connect(process.env.MONGO_URI || process.env.MONGO_URI_MAIN);
        console.log('✅ Connected to MongoDB\n');

        // Find registrations with installments where there's a mismatch
        const registrations = await ExhibitorRegistration.find({
            installments: { $exists: true, $ne: [] },
            $expr: { $gt: ['$amountPaid', 0] }
        }).populate('eventId', 'name paymentPlans').limit(10);

        console.log(`Found ${registrations.length} registrations to analyze\n`);
        console.log('═══════════════════════════════════════════════════════════\n');

        for (const reg of registrations) {
            console.log(`📋 ${reg.registrationId} - ${reg.exhibitorName}`);
            console.log(`   Event: ${reg.eventId?.name || 'N/A'}`);
            console.log(`   Status: ${reg.status}\n`);

            // Financial breakdown
            const fb = reg.financeBreakdown || {};
            const netPayable = fb.netPayable || reg.participation?.total || 0;
            
            console.log('💰 FINANCIAL SUMMARY:');
            console.log(`   Gross Amount:     ₹${(fb.grossAmount || 0).toLocaleString('en-IN')}`);
            console.log(`   After Discounts:  ₹${(fb.subtotal || 0).toLocaleString('en-IN')}`);
            console.log(`   + GST (18%):      ₹${(fb.gstAmount || 0).toLocaleString('en-IN')}`);
            console.log(`   - TDS (${fb.tdsPercent || 0}%):       ₹${(fb.tdsAmount || 0).toLocaleString('en-IN')}`);
            console.log(`   ─────────────────────────────────────`);
            console.log(`   NET PAYABLE:      ₹${netPayable.toLocaleString('en-IN')}`);
            console.log(`   Amount Paid:      ₹${(reg.amountPaid || 0).toLocaleString('en-IN')}`);
            console.log(`   Balance:          ₹${(reg.balanceAmount || 0).toLocaleString('en-IN')}\n`);

            // Payment History Analysis
            console.log('📜 PAYMENT HISTORY:');
            let totalFromHistory = 0;
            if (reg.paymentHistory && reg.paymentHistory.length > 0) {
                reg.paymentHistory.forEach((p, i) => {
                    totalFromHistory += p.amount || 0;
                    console.log(`   ${i + 1}. ₹${(p.amount || 0).toLocaleString('en-IN')} - ${p.method || 'N/A'} (${p.paymentType || 'N/A'})`);
                });
                console.log(`   Total: ₹${totalFromHistory.toLocaleString('en-IN')}\n`);
            } else {
                console.log(`   No payment history\n`);
            }

            // Installments Analysis
            console.log('📦 INSTALLMENTS:');
            let totalDue = 0;
            let totalPaidInInst = 0;
            
            if (reg.installments && reg.installments.length > 0) {
                reg.installments.forEach((inst, i) => {
                    totalDue += inst.dueAmount || 0;
                    totalPaidInInst += inst.paidAmount || 0;
                    
                    const remaining = (inst.dueAmount || 0) - (inst.paidAmount || 0);
                    const icon = inst.status === 'paid' ? '✅' : inst.status === 'partial' ? '🟡' : '⚪';
                    
                    console.log(`   ${icon} ${inst.label || `Phase ${i + 1}`} (${inst.percentage}%)`);
                    console.log(`      Due Amount:  ₹${(inst.dueAmount || 0).toLocaleString('en-IN')}`);
                    console.log(`      Paid Amount: ₹${(inst.paidAmount || 0).toLocaleString('en-IN')}`);
                    console.log(`      Remaining:   ₹${remaining.toLocaleString('en-IN')}`);
                    console.log(`      Status:      ${inst.status}`);
                });
                console.log(`   ─────────────────────────────────────`);
                console.log(`   Total Due:  ₹${totalDue.toLocaleString('en-IN')}`);
                console.log(`   Total Paid: ₹${totalPaidInInst.toLocaleString('en-IN')}\n`);
            }

            // Validation & Issues
            console.log('🔍 VALIDATION:');
            const issues = [];

            // Check 1: Amount Paid consistency
            if (reg.amountPaid !== totalFromHistory) {
                issues.push(`❌ Amount Paid mismatch: Registration=${reg.amountPaid}, History=${totalFromHistory}`);
            } else {
                console.log(`   ✅ Amount Paid matches payment history`);
            }

            // Check 2: Installments vs Payment History
            if (reg.installments.length > 0 && totalPaidInInst !== totalFromHistory) {
                issues.push(`❌ Installments mismatch: Installments=${totalPaidInInst}, History=${totalFromHistory}`);
            } else if (reg.installments.length > 0) {
                console.log(`   ✅ Installments match payment history`);
            }

            // Check 3: Balance calculation
            const calculatedBalance = Math.max(0, netPayable - reg.amountPaid);
            if (calculatedBalance !== reg.balanceAmount) {
                issues.push(`❌ Balance wrong: Expected=${calculatedBalance}, Actual=${reg.balanceAmount}`);
            } else {
                console.log(`   ✅ Balance calculation correct`);
            }

            // Check 4: Installment due amounts sum
            if (reg.installments.length > 0) {
                // For installment plans, the sum of all installment due amounts should equal netPayable
                // BUT this is only true if it's a complete installment plan (not partial payments)
                const lastInstallment = reg.installments[reg.installments.length - 1];
                if (lastInstallment.percentage === 100 || lastInstallment.planId === 'final_balance') {
                    if (Math.abs(totalDue - netPayable) > 1) { // Allow 1 rupee rounding difference
                        issues.push(`⚠️  Installment total (${totalDue}) doesn't match netPayable (${netPayable})`);
                    }
                }
            }

            // Check 5: Installment status correctness
            if (reg.installments.length > 0) {
                let cumulativePaid = 0;
                for (const inst of reg.installments) {
                    const expectedPaid = Math.min(inst.dueAmount, Math.max(0, reg.amountPaid - cumulativePaid));
                    if (Math.abs(inst.paidAmount - expectedPaid) > 1) {
                        issues.push(`⚠️  ${inst.label}: Expected paid=${expectedPaid}, Actual=${inst.paidAmount}`);
                    }
                    cumulativePaid += inst.dueAmount;
                }
            }

            if (issues.length > 0) {
                console.log('\n   ⚠️  ISSUES FOUND:');
                issues.forEach(issue => console.log(`   ${issue}`));
            }

            console.log('\n═══════════════════════════════════════════════════════════\n');
        }

        console.log('\n✅ Analysis complete\n');

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await mongoose.disconnect();
    }
}

analyzePaymentIssue();
