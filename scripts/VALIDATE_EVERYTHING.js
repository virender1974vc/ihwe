const mongoose = require('mongoose');
const ExhibitorRegistration = require('../models/ExhibitorRegistration');
require('dotenv').config();

/**
 * COMPLETE VALIDATION - Guarantee Everything is Working
 * 
 * This validates:
 * 1. Payment calculation logic
 * 2. Installment distribution
 * 3. Status updates
 * 4. Balance calculations
 * 5. Data consistency
 */

async function validateEverything() {
    try {
        await mongoose.connect(process.env.MONGO_URI || process.env.MONGO_URI_MAIN);
        console.log('✅ Connected to MongoDB\n');
        console.log('═══════════════════════════════════════════════════════════');
        console.log('         COMPLETE VALIDATION - EVERYTHING CHECK');
        console.log('═══════════════════════════════════════════════════════════\n');

        const registrations = await ExhibitorRegistration.find({
            $or: [
                { paymentHistory: { $exists: true, $ne: [] } },
                { installments: { $exists: true, $ne: [] } },
                { amountPaid: { $gt: 0 } }
            ]
        }).populate('eventId', 'name');

        console.log(`📋 Validating ${registrations.length} registrations\n`);

        let totalChecks = 0;
        let passedChecks = 0;
        let failedChecks = 0;
        let registrationsWithIssues = [];

        for (const reg of registrations) {
            const issues = [];
            let regChecks = 0;
            let regPassed = 0;

            console.log(`\n🔍 ${reg.registrationId} - ${reg.exhibitorName}`);

            const netPayable = reg.financeBreakdown?.netPayable || reg.participation?.total || 0;
            const totalFromHistory = (reg.paymentHistory || []).reduce((sum, p) => sum + (p.amount || 0), 0);
            const totalFromInstallments = (reg.installments || []).reduce((sum, inst) => sum + (inst.paidAmount || 0), 0);

            // CHECK 1: Amount Paid vs Payment History
            regChecks++;
            totalChecks++;
            if (reg.amountPaid === totalFromHistory) {
                console.log(`   ✅ Check 1: Amount Paid matches Payment History`);
                regPassed++;
                passedChecks++;
            } else {
                console.log(`   ❌ Check 1: Amount Paid mismatch`);
                console.log(`      Registration: ₹${reg.amountPaid.toLocaleString('en-IN')}`);
                console.log(`      History: ₹${totalFromHistory.toLocaleString('en-IN')}`);
                issues.push('Amount Paid mismatch');
                failedChecks++;
            }

            // CHECK 2: Installments vs Payment History
            if (reg.installments && reg.installments.length > 0) {
                regChecks++;
                totalChecks++;
                if (totalFromInstallments === totalFromHistory) {
                    console.log(`   ✅ Check 2: Installments match Payment History`);
                    regPassed++;
                    passedChecks++;
                } else {
                    console.log(`   ❌ Check 2: Installments mismatch`);
                    console.log(`      Installments: ₹${totalFromInstallments.toLocaleString('en-IN')}`);
                    console.log(`      History: ₹${totalFromHistory.toLocaleString('en-IN')}`);
                    issues.push('Installments mismatch');
                    failedChecks++;
                }
            }

            // CHECK 3: Balance Calculation
            regChecks++;
            totalChecks++;
            const calculatedBalance = Math.max(0, netPayable - reg.amountPaid);
            if (reg.balanceAmount === calculatedBalance) {
                console.log(`   ✅ Check 3: Balance calculation correct`);
                regPassed++;
                passedChecks++;
            } else {
                console.log(`   ❌ Check 3: Balance calculation wrong`);
                console.log(`      Expected: ₹${calculatedBalance.toLocaleString('en-IN')}`);
                console.log(`      Actual: ₹${reg.balanceAmount.toLocaleString('en-IN')}`);
                issues.push('Balance calculation wrong');
                failedChecks++;
            }

            // CHECK 4: Total Payable
            regChecks++;
            totalChecks++;
            const expectedTotalPayable = reg.balanceAmount + (reg.penaltyAmount || 0);
            if (reg.totalPayable === expectedTotalPayable) {
                console.log(`   ✅ Check 4: Total Payable correct`);
                regPassed++;
                passedChecks++;
            } else {
                console.log(`   ❌ Check 4: Total Payable wrong`);
                console.log(`      Expected: ₹${expectedTotalPayable.toLocaleString('en-IN')}`);
                console.log(`      Actual: ₹${reg.totalPayable.toLocaleString('en-IN')}`);
                issues.push('Total Payable wrong');
                failedChecks++;
            }

            // CHECK 5: Status Correctness
            regChecks++;
            totalChecks++;
            let expectedStatus = reg.status;
            if (reg.balanceAmount <= 0) {
                expectedStatus = 'paid';
            } else if (reg.amountPaid > 0) {
                expectedStatus = 'advance-paid';
            }
            if (reg.status === expectedStatus || ['approved', 'confirmed', 'rejected'].includes(reg.status)) {
                console.log(`   ✅ Check 5: Status is correct (${reg.status})`);
                regPassed++;
                passedChecks++;
            } else {
                console.log(`   ❌ Check 5: Status should be "${expectedStatus}" but is "${reg.status}"`);
                issues.push('Status incorrect');
                failedChecks++;
            }

            // CHECK 6: Installment Statuses
            if (reg.installments && reg.installments.length > 0) {
                regChecks++;
                totalChecks++;
                let allInstallmentsCorrect = true;

                for (const inst of reg.installments) {
                    const paidAmount = inst.paidAmount || 0;
                    const dueAmount = inst.dueAmount || 0;
                    let expectedInstStatus = 'pending';

                    if (paidAmount >= dueAmount) {
                        expectedInstStatus = 'paid';
                    } else if (paidAmount > 0) {
                        expectedInstStatus = 'partial';
                    }

                    // Allow overdue status
                    if (inst.status !== expectedInstStatus && inst.status !== 'overdue') {
                        allInstallmentsCorrect = false;
                        console.log(`   ❌ ${inst.label}: Status should be "${expectedInstStatus}" but is "${inst.status}"`);
                    }
                }

                if (allInstallmentsCorrect) {
                    console.log(`   ✅ Check 6: All installment statuses correct`);
                    regPassed++;
                    passedChecks++;
                } else {
                    issues.push('Installment statuses incorrect');
                    failedChecks++;
                }
            }

            // CHECK 7: Installment Distribution
            if (reg.installments && reg.installments.length > 0) {
                regChecks++;
                totalChecks++;
                let distributionCorrect = true;
                let remainingPaid = reg.amountPaid;

                for (const inst of reg.installments.sort((a, b) => a.installmentNumber - b.installmentNumber)) {
                    const dueAmount = inst.dueAmount || 0;
                    let expectedPaid = 0;

                    if (remainingPaid >= dueAmount) {
                        expectedPaid = dueAmount;
                        remainingPaid -= dueAmount;
                    } else if (remainingPaid > 0) {
                        expectedPaid = remainingPaid;
                        remainingPaid = 0;
                    }

                    if (Math.abs((inst.paidAmount || 0) - expectedPaid) > 1) { // Allow 1 rupee rounding
                        distributionCorrect = false;
                        console.log(`   ❌ ${inst.label}: Expected paid=₹${expectedPaid.toLocaleString('en-IN')}, Actual=₹${(inst.paidAmount || 0).toLocaleString('en-IN')}`);
                    }
                }

                if (distributionCorrect) {
                    console.log(`   ✅ Check 7: Installment distribution correct`);
                    regPassed++;
                    passedChecks++;
                } else {
                    issues.push('Installment distribution incorrect');
                    failedChecks++;
                }
            }

            // Summary for this registration
            if (issues.length > 0) {
                registrationsWithIssues.push({
                    id: reg.registrationId,
                    name: reg.exhibitorName,
                    issues: issues
                });
                console.log(`\n   ⚠️  ${issues.length} issue(s) found`);
            } else {
                console.log(`\n   ✅ All checks passed (${regPassed}/${regChecks})`);
            }
        }

        // FINAL SUMMARY
        console.log('\n═══════════════════════════════════════════════════════════');
        console.log('                    VALIDATION SUMMARY');
        console.log('═══════════════════════════════════════════════════════════\n');
        console.log(`Total Checks:        ${totalChecks}`);
        console.log(`✅ Passed:           ${passedChecks} (${Math.round(passedChecks/totalChecks*100)}%)`);
        console.log(`❌ Failed:           ${failedChecks} (${Math.round(failedChecks/totalChecks*100)}%)`);
        console.log(`\nRegistrations:       ${registrations.length}`);
        console.log(`✅ Clean:            ${registrations.length - registrationsWithIssues.length}`);
        console.log(`⚠️  With Issues:     ${registrationsWithIssues.length}`);

        if (registrationsWithIssues.length > 0) {
            console.log('\n═══════════════════════════════════════════════════════════');
            console.log('              REGISTRATIONS NEEDING FIX');
            console.log('═══════════════════════════════════════════════════════════\n');
            registrationsWithIssues.forEach((reg, i) => {
                console.log(`${i + 1}. ${reg.id} - ${reg.name}`);
                reg.issues.forEach(issue => console.log(`   - ${issue}`));
            });
            console.log('\n💡 Run this to fix:');
            console.log('   node scripts/FINAL_FIX.js\n');
        } else {
            console.log('\n🎉 PERFECT! Everything is working correctly!\n');
        }

        console.log('═══════════════════════════════════════════════════════════\n');

    } catch (error) {
        console.error('❌ Validation Error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Disconnected from MongoDB\n');
    }
}

console.log('\n🚀 Starting Complete Validation...\n');
validateEverything();
