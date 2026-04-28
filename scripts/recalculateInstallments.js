const mongoose = require('mongoose');
const ExhibitorRegistration = require('../models/ExhibitorRegistration');
require('dotenv').config();

/**
 * Recalculate Installments Based on Actual Payments
 * 
 * This fixes the issue where:
 * - Installments show wrong amounts
 * - Phase display is incorrect
 * - Remaining amounts don't match
 */

async function recalculateInstallments() {
    try {
        await mongoose.connect(process.env.MONGO_URI || process.env.MONGO_URI_MAIN);
        console.log('✅ Connected to MongoDB\n');

        const registrations = await ExhibitorRegistration.find({
            installments: { $exists: true, $ne: [] }
        }).populate('eventId', 'name paymentPlans');

        console.log(`📋 Found ${registrations.length} registrations with installments\n`);

        let fixedCount = 0;
        let errorCount = 0;

        for (const reg of registrations) {
            try {
                console.log(`\n🔧 Processing: ${reg.registrationId} - ${reg.exhibitorName}`);
                
                const netPayable = reg.financeBreakdown?.netPayable || reg.participation?.total || 0;
                
                // Calculate total paid from payment history (most reliable source)
                const totalPaid = (reg.paymentHistory || []).reduce((sum, p) => sum + (p.amount || 0), 0);
                
                console.log(`   Net Payable: ₹${netPayable.toLocaleString('en-IN')}`);
                console.log(`   Total Paid: ₹${totalPaid.toLocaleString('en-IN')}`);
                console.log(`   Balance: ₹${(netPayable - totalPaid).toLocaleString('en-IN')}`);

                // Sort installments
                const sortedInst = [...reg.installments].sort((a, b) => a.installmentNumber - b.installmentNumber);

                // Recalculate each installment
                let remainingToPay = netPayable;
                let remainingPaid = totalPaid;
                let needsUpdate = false;

                console.log(`\n   📦 Recalculating Installments:`);

                for (let i = 0; i < sortedInst.length; i++) {
                    const inst = sortedInst[i];
                    const oldPaidAmount = inst.paidAmount || 0;
                    const oldStatus = inst.status;

                    // Calculate what this installment should have as dueAmount
                    // This is based on the percentage of netPayable
                    let dueAmount;
                    
                    if (i === sortedInst.length - 1) {
                        // Last installment gets whatever is remaining (handles rounding)
                        dueAmount = remainingToPay;
                    } else {
                        // Calculate based on percentage
                        const percentageOfTotal = inst.percentage / 100;
                        const cumulativeAmount = Math.round(netPayable * percentageOfTotal);
                        
                        // This installment's due is the difference from previous cumulative
                        const previousCumulative = i > 0 
                            ? Math.round(netPayable * (sortedInst[i-1].percentage / 100))
                            : 0;
                        
                        dueAmount = cumulativeAmount - previousCumulative;
                    }

                    // Calculate how much of this installment is paid
                    let paidAmount = 0;
                    let status = 'pending';

                    if (remainingPaid >= dueAmount) {
                        // Fully paid
                        paidAmount = dueAmount;
                        status = 'paid';
                        remainingPaid -= dueAmount;
                    } else if (remainingPaid > 0) {
                        // Partially paid
                        paidAmount = remainingPaid;
                        status = 'partial';
                        remainingPaid = 0;
                    } else {
                        // Not paid
                        paidAmount = 0;
                        status = 'pending';
                    }

                    // Check if overdue
                    if (status !== 'paid' && inst.dueDate && new Date(inst.dueDate) < new Date()) {
                        status = 'overdue';
                    }

                    // Update installment
                    if (inst.dueAmount !== dueAmount || inst.paidAmount !== paidAmount || inst.status !== status) {
                        needsUpdate = true;
                    }

                    inst.dueAmount = dueAmount;
                    inst.paidAmount = paidAmount;
                    inst.status = status;
                    if (paidAmount > 0 && !inst.paidAt) {
                        inst.paidAt = new Date();
                    }

                    remainingToPay -= dueAmount;

                    const icon = status === 'paid' ? '✅' : status === 'partial' ? '🟡' : status === 'overdue' ? '🔴' : '⚪';
                    console.log(`      ${icon} ${inst.label}`);
                    console.log(`         Due: ₹${dueAmount.toLocaleString('en-IN')} | Paid: ₹${paidAmount.toLocaleString('en-IN')} | Status: ${status}`);
                    
                    if (oldPaidAmount !== paidAmount || oldStatus !== status) {
                        console.log(`         (Changed from: Paid=₹${oldPaidAmount.toLocaleString('en-IN')}, Status=${oldStatus})`);
                    }
                }

                // Update registration amounts
                const correctBalance = Math.max(0, netPayable - totalPaid);
                const correctStatus = correctBalance <= 0 ? 'paid' : (totalPaid > 0 ? 'advance-paid' : reg.status);

                if (reg.amountPaid !== totalPaid || reg.balanceAmount !== correctBalance || reg.status !== correctStatus || needsUpdate) {
                    reg.amountPaid = totalPaid;
                    reg.balanceAmount = correctBalance;
                    reg.totalPayable = correctBalance + (reg.penaltyAmount || 0);
                    reg.status = correctStatus;

                    await reg.save();
                    fixedCount++;
                    console.log(`\n   ✅ FIXED - Updated registration and installments`);
                } else {
                    console.log(`\n   ✓ Already correct`);
                }

            } catch (err) {
                console.error(`   ❌ Error processing ${reg.registrationId}:`, err.message);
                errorCount++;
            }
        }

        console.log(`\n\n═══════════════════════════════════════════════════════════`);
        console.log(`✅ Fixed: ${fixedCount} registrations`);
        console.log(`✓ Correct: ${registrations.length - fixedCount - errorCount} registrations`);
        if (errorCount > 0) {
            console.log(`❌ Errors: ${errorCount} registrations`);
        }
        console.log(`═══════════════════════════════════════════════════════════\n`);

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Disconnected from MongoDB\n');
    }
}

recalculateInstallments();
