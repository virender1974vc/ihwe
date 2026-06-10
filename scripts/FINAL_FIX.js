const mongoose = require('mongoose');
const ExhibitorRegistration = require('../models/exhibitor_seller/ExhibitorRegistration');
const Event = require('../models/event_conference/Event');
require('dotenv').config();
async function finalFix() {
    try {
        await mongoose.connect(process.env.MONGO_URI || process.env.MONGO_URI_MAIN);
        console.log('✅ Connected to MongoDB\n');
        console.log('═══════════════════════════════════════════════════════════');
        console.log('           FINAL PAYMENT & INSTALLMENT FIX');
        console.log('═══════════════════════════════════════════════════════════\n');
        const registrations = await ExhibitorRegistration.find({
            $or: [
                { paymentHistory: { $exists: true, $ne: [] } },
                { installments: { $exists: true, $ne: [] } },
                { amountPaid: { $gt: 0 } }
            ]
        });

        console.log(`📋 Found ${registrations.length} registrations to process\n`);

        let fixedCount = 0;
        let alreadyCorrect = 0;
        let errorCount = 0;

        for (const reg of registrations) {
            try {
                console.log(`\n🔧 ${reg.registrationId} - ${reg.exhibitorName}`);
                
                // Step 1: Calculate correct total paid from payment history
                const totalPaidFromHistory = (reg.paymentHistory || []).reduce((sum, p) => sum + (p.amount || 0), 0);
                const netPayable = reg.financeBreakdown?.netPayable || reg.participation?.total || 0;
                const correctBalance = Math.max(0, netPayable - totalPaidFromHistory);

                console.log(`   Net Payable: ₹${netPayable.toLocaleString('en-IN')}`);
                console.log(`   Total Paid: ₹${totalPaidFromHistory.toLocaleString('en-IN')}`);
                console.log(`   Balance: ₹${correctBalance.toLocaleString('en-IN')}`);

                let needsUpdate = false;

                // Check if amounts need updating
                if (reg.amountPaid !== totalPaidFromHistory) {
                    console.log(`   ⚠️  Amount Paid: ₹${(reg.amountPaid || 0).toLocaleString('en-IN')} → ₹${totalPaidFromHistory.toLocaleString('en-IN')}`);
                    needsUpdate = true;
                }

                if (reg.balanceAmount !== correctBalance) {
                    console.log(`   ⚠️  Balance: ₹${(reg.balanceAmount || 0).toLocaleString('en-IN')} → ₹${correctBalance.toLocaleString('en-IN')}`);
                    needsUpdate = true;
                }

                // Step 2: Update installments if they exist
                if (reg.installments && reg.installments.length > 0) {
                    console.log(`\n   📦 Updating ${reg.installments.length} installments:`);
                    
                    // Sort by installment number
                    const sortedInst = [...reg.installments].sort((a, b) => a.installmentNumber - b.installmentNumber);
                    
                    let remainingPaid = totalPaidFromHistory;

                    for (const inst of sortedInst) {
                        const oldPaid = inst.paidAmount || 0;
                        const oldStatus = inst.status;
                        const dueAmount = inst.dueAmount || 0;

                        // Calculate new paid amount for this installment
                        let newPaidAmount = 0;
                        let newStatus = 'pending';

                        if (remainingPaid >= dueAmount) {
                            // Fully paid
                            newPaidAmount = dueAmount;
                            newStatus = 'paid';
                            remainingPaid -= dueAmount;
                        } else if (remainingPaid > 0) {
                            // Partially paid
                            newPaidAmount = remainingPaid;
                            newStatus = 'partial';
                            remainingPaid = 0;
                        } else {
                            // Not paid
                            newPaidAmount = 0;
                            newStatus = 'pending';
                        }

                        // Check if overdue
                        if (newStatus !== 'paid' && inst.dueDate && new Date(inst.dueDate) < new Date()) {
                            newStatus = 'overdue';
                        }

                        // Update if changed
                        if (inst.paidAmount !== newPaidAmount || inst.status !== newStatus) {
                            const icon = newStatus === 'paid' ? '✅' : newStatus === 'partial' ? '🟡' : newStatus === 'overdue' ? '🔴' : '⚪';
                            console.log(`      ${icon} ${inst.label}`);
                            console.log(`         Due: ₹${dueAmount.toLocaleString('en-IN')}`);
                            console.log(`         Paid: ₹${oldPaid.toLocaleString('en-IN')} → ₹${newPaidAmount.toLocaleString('en-IN')}`);
                            console.log(`         Status: ${oldStatus} → ${newStatus}`);
                            
                            inst.paidAmount = newPaidAmount;
                            inst.status = newStatus;
                            if (newPaidAmount > 0 && !inst.paidAt) {
                                inst.paidAt = new Date();
                            }
                            needsUpdate = true;
                        }
                    }
                }

                // Step 3: Update overall status
                let correctStatus = reg.status;
                if (correctBalance <= 0) {
                    correctStatus = 'paid';
                } else if (totalPaidFromHistory > 0) {
                    correctStatus = 'advance-paid';
                }

                if (reg.status !== correctStatus) {
                    console.log(`   ⚠️  Status: ${reg.status} → ${correctStatus}`);
                    needsUpdate = true;
                }

                // Step 4: Save if needed
                if (needsUpdate) {
                    reg.amountPaid = totalPaidFromHistory;
                    reg.balanceAmount = correctBalance;
                    reg.totalPayable = correctBalance + (reg.penaltyAmount || 0);
                    reg.status = correctStatus;

                    // Reset penalty if fully paid
                    if (correctStatus === 'paid') {
                        reg.penaltyAmount = 0;
                        reg.penaltyReason = null;
                        reg.totalPayable = 0;
                    }

                    await reg.save();
                    fixedCount++;
                    console.log(`\n   ✅ FIXED`);
                } else {
                    alreadyCorrect++;
                    console.log(`\n   ✓ Already correct`);
                }

            } catch (err) {
                console.error(`\n   ❌ Error: ${err.message}`);
                errorCount++;
            }
        }

        console.log('\n═══════════════════════════════════════════════════════════');
        console.log('                      SUMMARY');
        console.log('═══════════════════════════════════════════════════════════');
        console.log(`✅ Fixed:           ${fixedCount} registrations`);
        console.log(`✓  Already Correct: ${alreadyCorrect} registrations`);
        if (errorCount > 0) {
            console.log(`❌ Errors:          ${errorCount} registrations`);
        }
        console.log(`📊 Total Processed: ${registrations.length} registrations`);
        console.log('═══════════════════════════════════════════════════════════\n');

        if (fixedCount > 0) {
            console.log('💡 Next Steps:');
            console.log('   1. Restart your backend server');
            console.log('   2. Clear browser cache');
            console.log('   3. Check exhibitor payment pages');
            console.log('   4. Verify amounts are now correct\n');
        }

    } catch (error) {
        console.error('❌ Fatal Error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Disconnected from MongoDB\n');
    }
}

// Run the fix
console.log('\n🚀 Starting Final Fix...\n');
finalFix();
