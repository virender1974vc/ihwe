const mongoose = require('mongoose');
const ExhibitorRegistration = require('../models/ExhibitorRegistration');
require('dotenv').config();

/**
 * Debug Installments - Check actual data structure
 */

async function debugInstallments() {
    try {
        await mongoose.connect(process.env.MONGO_URI || process.env.MONGO_URI_MAIN);
        console.log('✅ Connected to MongoDB\n');
        const reg = await ExhibitorRegistration.findOne({
            'participation.total': { $gte: 122140, $lte: 122150 },
            amountPaid: { $gte: 106870, $lte: 106890 }
        }).populate('eventId', 'name paymentPlans');

        if (!reg) {
            console.log('❌ Registration not found with those amounts');
            console.log('Searching for any registration with installments...\n');
            
            const anyReg = await ExhibitorRegistration.findOne({
                installments: { $exists: true, $ne: [] }
            }).populate('eventId', 'name paymentPlans').sort({ updatedAt: -1 });
            
            if (anyReg) {
                await analyzeRegistration(anyReg);
            }
        } else {
            await analyzeRegistration(reg);
        }

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('\n🔌 Disconnected from MongoDB\n');
    }
}

async function analyzeRegistration(reg) {
    console.log('═══════════════════════════════════════════════════════════');
    console.log(`📋 ${reg.registrationId} - ${reg.exhibitorName}`);
    console.log('═══════════════════════════════════════════════════════════\n');

    const netPayable = reg.financeBreakdown?.netPayable || reg.participation?.total || 0;
    const totalPaid = reg.amountPaid || 0;
    const balance = reg.balanceAmount || 0;

    console.log('💰 FINANCIAL SUMMARY:');
    console.log(`   Net Payable:  ₹${netPayable.toLocaleString('en-IN')}`);
    console.log(`   Amount Paid:  ₹${totalPaid.toLocaleString('en-IN')}`);
    console.log(`   Balance:      ₹${balance.toLocaleString('en-IN')}`);
    console.log(`   Status:       ${reg.status}\n`);

    console.log('📦 INSTALLMENTS STRUCTURE:\n');
    
    if (!reg.installments || reg.installments.length === 0) {
        console.log('   ⚠️  No installments found\n');
        return;
    }

    let totalDue = 0;
    let totalPaidInInst = 0;

    reg.installments.forEach((inst, i) => {
        totalDue += inst.dueAmount || 0;
        totalPaidInInst += inst.paidAmount || 0;

        console.log(`   ${i + 1}. ${inst.label || `Installment ${inst.installmentNumber}`}`);
        console.log(`      Plan ID:      ${inst.planId}`);
        console.log(`      Percentage:   ${inst.percentage}%`);
        console.log(`      Due Amount:   ₹${(inst.dueAmount || 0).toLocaleString('en-IN')}`);
        console.log(`      Paid Amount:  ₹${(inst.paidAmount || 0).toLocaleString('en-IN')}`);
        console.log(`      Remaining:    ₹${((inst.dueAmount || 0) - (inst.paidAmount || 0)).toLocaleString('en-IN')}`);
        console.log(`      Status:       ${inst.status}`);
        console.log(`      Due Date:     ${inst.dueDate ? new Date(inst.dueDate).toLocaleDateString('en-IN') : 'Not set'}`);
        console.log('');
    });

    console.log(`   ─────────────────────────────────────────`);
    console.log(`   Total Due (Sum):  ₹${totalDue.toLocaleString('en-IN')}`);
    console.log(`   Total Paid (Sum): ₹${totalPaidInInst.toLocaleString('en-IN')}`);
    console.log(`   Net Payable:      ₹${netPayable.toLocaleString('en-IN')}`);

    console.log('\n🔍 VALIDATION:\n');

    // Check 1: Total due should equal net payable
    if (Math.abs(totalDue - netPayable) <= 1) {
        console.log(`   ✅ Total installment due matches net payable`);
    } else {
        console.log(`   ❌ Mismatch: Total due (${totalDue}) != Net payable (${netPayable})`);
        console.log(`      Difference: ₹${Math.abs(totalDue - netPayable).toLocaleString('en-IN')}`);
    }

    // Check 2: Total paid in installments should match amountPaid
    if (Math.abs(totalPaidInInst - totalPaid) <= 1) {
        console.log(`   ✅ Total paid in installments matches amountPaid`);
    } else {
        console.log(`   ❌ Mismatch: Installments (${totalPaidInInst}) != amountPaid (${totalPaid})`);
        console.log(`      Difference: ₹${Math.abs(totalPaidInInst - totalPaid).toLocaleString('en-IN')}`);
    }

    // Check 3: Remaining should match balance
    const calculatedRemaining = totalDue - totalPaidInInst;
    if (Math.abs(calculatedRemaining - balance) <= 1) {
        console.log(`   ✅ Calculated remaining matches balance`);
    } else {
        console.log(`   ❌ Mismatch: Calculated (${calculatedRemaining}) != Balance (${balance})`);
    }

    console.log('\n📜 PAYMENT HISTORY:\n');
    
    if (reg.paymentHistory && reg.paymentHistory.length > 0) {
        let totalFromHistory = 0;
        reg.paymentHistory.forEach((p, i) => {
            totalFromHistory += p.amount || 0;
            console.log(`   ${i + 1}. ₹${(p.amount || 0).toLocaleString('en-IN')} - ${p.method || 'N/A'}`);
            console.log(`      Type: ${p.paymentType || 'N/A'}`);
            console.log(`      Mode: ${p.paymentMode || 'N/A'}`);
            console.log(`      Date: ${p.paidAt ? new Date(p.paidAt).toLocaleDateString('en-IN') : 'N/A'}`);
            console.log('');
        });
        console.log(`   Total from History: ₹${totalFromHistory.toLocaleString('en-IN')}`);
        
        if (Math.abs(totalFromHistory - totalPaid) <= 1) {
            console.log(`   ✅ Payment history matches amountPaid`);
        } else {
            console.log(`   ❌ Mismatch: History (${totalFromHistory}) != amountPaid (${totalPaid})`);
        }
    }

    console.log('\n💡 RECOMMENDATION:\n');
    
    if (Math.abs(totalPaidInInst - totalPaid) > 1 || Math.abs(totalDue - netPayable) > 1) {
        console.log(`   ⚠️  This registration needs to be fixed!`);
        console.log(`   Run: node scripts/FINAL_FIX.js`);
    } else {
        console.log(`   ✅ This registration looks correct!`);
    }

    console.log('\n═══════════════════════════════════════════════════════════\n');
}

debugInstallments();
