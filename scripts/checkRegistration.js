const mongoose = require('mongoose');
const ExhibitorRegistration = require('../models/ExhibitorRegistration');
require('dotenv').config();

/**
 * Check a specific registration's payment details
 * Usage: node scripts/checkRegistration.js <registrationId>
 */

async function checkRegistration() {
    try {
        const registrationId = process.argv[2];
        
        if (!registrationId) {
            console.log('❌ Please provide a registration ID');
            console.log('Usage: node scripts/checkRegistration.js <registrationId>');
            process.exit(1);
        }

        await mongoose.connect(process.env.MONGO_URI || process.env.MONGO_URI_MAIN);
        console.log('✅ Connected to MongoDB\n');

        // Find registration by registrationId or _id
        let registration = await ExhibitorRegistration.findOne({ registrationId })
            .populate('eventId', 'name paymentPlans');
        
        if (!registration) {
            registration = await ExhibitorRegistration.findById(registrationId)
                .populate('eventId', 'name paymentPlans');
        }

        if (!registration) {
            console.log(`❌ Registration not found: ${registrationId}`);
            process.exit(1);
        }

        console.log('═══════════════════════════════════════════════════════════');
        console.log(`📋 REGISTRATION: ${registration.registrationId}`);
        console.log(`👤 Exhibitor: ${registration.exhibitorName}`);
        console.log(`🎪 Event: ${registration.eventId?.name || 'N/A'}`);
        console.log(`📊 Status: ${registration.status}`);
        console.log('═══════════════════════════════════════════════════════════\n');

        // Financial Summary
        const fb = registration.financeBreakdown || {};
        const netPayable = fb.netPayable || registration.participation?.total || 0;
        
        console.log('💰 FINANCIAL BREAKDOWN:');
        console.log(`   Gross Amount:        ₹${(fb.grossAmount || 0).toLocaleString('en-IN')}`);
        console.log(`   Stall Discount:      -₹${(fb.stallDiscountAmount || 0).toLocaleString('en-IN')} (${fb.stallDiscountPercent || 0}%)`);
        console.log(`   Plan Discount:       -₹${(fb.discountAmount || 0).toLocaleString('en-IN')} (${fb.discountPercent || 0}%)`);
        console.log(`   Subtotal (Taxable):  ₹${(fb.subtotal || 0).toLocaleString('en-IN')}`);
        console.log(`   GST (18%):           +₹${(fb.gstAmount || 0).toLocaleString('en-IN')}`);
        console.log(`   TDS (${fb.tdsPercent || 0}%):            -₹${(fb.tdsAmount || 0).toLocaleString('en-IN')}`);
        console.log(`   ─────────────────────────────────────────`);
        console.log(`   NET PAYABLE:         ₹${netPayable.toLocaleString('en-IN')}`);
        console.log(`   Amount Paid:         ₹${(registration.amountPaid || 0).toLocaleString('en-IN')}`);
        console.log(`   Balance Due:         ₹${(registration.balanceAmount || 0).toLocaleString('en-IN')}`);
        console.log(`   Penalty:             ₹${(registration.penaltyAmount || 0).toLocaleString('en-IN')}`);
        console.log(`   ─────────────────────────────────────────`);
        console.log(`   TOTAL PAYABLE:       ₹${(registration.totalPayable || 0).toLocaleString('en-IN')}\n`);

        // Payment History
        if (registration.paymentHistory && registration.paymentHistory.length > 0) {
            console.log('📜 PAYMENT HISTORY:');
            let totalFromHistory = 0;
            registration.paymentHistory.forEach((payment, index) => {
                totalFromHistory += payment.amount || 0;
                console.log(`   ${index + 1}. ₹${(payment.amount || 0).toLocaleString('en-IN')} - ${payment.method || payment.paymentMode || 'N/A'}`);
                console.log(`      Type: ${payment.paymentType || 'N/A'}`);
                console.log(`      Date: ${payment.paidAt ? new Date(payment.paidAt).toLocaleDateString('en-IN') : 'N/A'}`);
                console.log(`      Txn ID: ${payment.transactionId || payment.razorpayPaymentId || 'N/A'}`);
                if (payment.notes) console.log(`      Notes: ${payment.notes}`);
                console.log('');
            });
            console.log(`   Total from History: ₹${totalFromHistory.toLocaleString('en-IN')}\n`);
        }

        // Installments
        if (registration.installments && registration.installments.length > 0) {
            console.log('📦 INSTALLMENTS:');
            console.log(`   Payment Plan: ${registration.paymentPlanLabel || registration.paymentPlanType || 'N/A'}\n`);
            
            let totalPaidInInstallments = 0;
            let totalDueInInstallments = 0;
            
            registration.installments.forEach((inst, index) => {
                totalPaidInInstallments += inst.paidAmount || 0;
                totalDueInInstallments += inst.dueAmount || 0;
                
                const statusIcon = inst.status === 'paid' ? '✅' : inst.status === 'partial' ? '🟡' : inst.status === 'overdue' ? '🔴' : '⚪';
                console.log(`   ${statusIcon} ${inst.label || `Installment ${inst.installmentNumber}`}`);
                console.log(`      Phase: ${inst.percentage}% | Status: ${inst.status.toUpperCase()}`);
                console.log(`      Due Amount: ₹${(inst.dueAmount || 0).toLocaleString('en-IN')}`);
                console.log(`      Paid Amount: ₹${(inst.paidAmount || 0).toLocaleString('en-IN')}`);
                console.log(`      Remaining: ₹${((inst.dueAmount || 0) - (inst.paidAmount || 0)).toLocaleString('en-IN')}`);
                console.log(`      Due Date: ${inst.dueDate ? new Date(inst.dueDate).toLocaleDateString('en-IN') : 'Not set'}`);
                if (inst.paidAt) console.log(`      Paid At: ${new Date(inst.paidAt).toLocaleDateString('en-IN')}`);
                console.log('');
            });
            
            console.log(`   Total Due (Installments): ₹${totalDueInInstallments.toLocaleString('en-IN')}`);
            console.log(`   Total Paid (Installments): ₹${totalPaidInInstallments.toLocaleString('en-IN')}`);
            console.log(`   Remaining: ₹${(totalDueInInstallments - totalPaidInInstallments).toLocaleString('en-IN')}\n`);
        }

        // Validation
        console.log('🔍 VALIDATION:');
        const totalFromHistory = (registration.paymentHistory || []).reduce((sum, p) => sum + (p.amount || 0), 0);
        const totalFromInstallments = (registration.installments || []).reduce((sum, inst) => sum + (inst.paidAmount || 0), 0);
        
        console.log(`   ✓ Amount Paid (Registration): ₹${(registration.amountPaid || 0).toLocaleString('en-IN')}`);
        console.log(`   ✓ Total from Payment History: ₹${totalFromHistory.toLocaleString('en-IN')}`);
        console.log(`   ✓ Total from Installments: ₹${totalFromInstallments.toLocaleString('en-IN')}`);
        
        const isConsistent = 
            registration.amountPaid === totalFromHistory &&
            (registration.installments.length === 0 || registration.amountPaid === totalFromInstallments);
        
        if (isConsistent) {
            console.log(`   ✅ All amounts are CONSISTENT`);
        } else {
            console.log(`   ❌ INCONSISTENCY DETECTED!`);
            console.log(`   → Run: node scripts/fixInstallmentCalculations.js`);
        }
        
        const calculatedBalance = Math.max(0, netPayable - registration.amountPaid);
        if (calculatedBalance === registration.balanceAmount) {
            console.log(`   ✅ Balance calculation is CORRECT`);
        } else {
            console.log(`   ❌ Balance calculation is WRONG`);
            console.log(`      Expected: ₹${calculatedBalance.toLocaleString('en-IN')}`);
            console.log(`      Actual: ₹${(registration.balanceAmount || 0).toLocaleString('en-IN')}`);
        }

        console.log('\n═══════════════════════════════════════════════════════════\n');

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await mongoose.disconnect();
    }
}

checkRegistration();
