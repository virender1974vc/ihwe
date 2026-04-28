const mongoose = require('mongoose');
const ExhibitorRegistration = require('../models/ExhibitorRegistration');
require('dotenv').config();
async function fixInstallmentCalculations() {
    try {
        await mongoose.connect(process.env.MONGO_URI || process.env.MONGO_URI_MAIN);
        console.log('✅ Connected to MongoDB\n');
        const registrations = await ExhibitorRegistration.find({
            installments: { $exists: true, $ne: [] }
        }).populate('eventId', 'name paymentPlans');

        console.log(`📋 Found ${registrations.length} registrations with installments\n`);

        let fixedCount = 0;

        for (const reg of registrations) {
            console.log(`\n🔍 Processing: ${reg.registrationId} - ${reg.exhibitorName}`);
            
            const netPayable = reg.financeBreakdown?.netPayable || reg.participation?.total || 0;
            console.log(`   Net Payable: ₹${netPayable.toLocaleString('en-IN')}`);

            // Calculate total paid from payment history
            const totalPaidFromHistory = (reg.paymentHistory || []).reduce((sum, p) => sum + (p.amount || 0), 0);
            console.log(`   Total Paid (from history): ₹${totalPaidFromHistory.toLocaleString('en-IN')}`);

            // Calculate total paid from installments
            const totalPaidInInstallments = (reg.installments || []).reduce((sum, inst) => sum + (inst.paidAmount || 0), 0);
            console.log(`   Total Paid (from installments): ₹${totalPaidInInstallments.toLocaleString('en-IN')}`);

            // Use the maximum of the two as the correct amount paid
            const correctAmountPaid = Math.max(totalPaidFromHistory, totalPaidInInstallments, reg.amountPaid || 0);
            console.log(`   Correct Amount Paid: ₹${correctAmountPaid.toLocaleString('en-IN')}`);

            // Calculate correct balance
            const correctBalance = Math.max(0, netPayable - correctAmountPaid);
            console.log(`   Correct Balance: ₹${correctBalance.toLocaleString('en-IN')}`);

            // Sort installments by installment number
            const sortedInstallments = [...(reg.installments || [])].sort((a, b) => a.installmentNumber - b.installmentNumber);

            // Redistribute paid amounts across installments
            let remainingPaid = correctAmountPaid;
            const updatedInstallments = [];

            for (const inst of sortedInstallments) {
                const dueAmount = inst.dueAmount || 0;
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

                updatedInstallments.push({
                    ...inst.toObject(),
                    paidAmount,
                    status,
                    paidAt: paidAmount > 0 ? (inst.paidAt || new Date()) : null
                });

                console.log(`   📦 ${inst.label}: ₹${paidAmount.toLocaleString('en-IN')} / ₹${dueAmount.toLocaleString('en-IN')} - ${status}`);
            }

            // Determine overall status
            let newStatus = reg.status;
            if (correctBalance <= 0) {
                newStatus = 'paid';
            } else if (correctAmountPaid > 0) {
                newStatus = 'advance-paid';
            }

            // Check if anything needs updating
            const needsUpdate = 
                reg.amountPaid !== correctAmountPaid ||
                reg.balanceAmount !== correctBalance ||
                reg.status !== newStatus ||
                JSON.stringify(reg.installments) !== JSON.stringify(updatedInstallments);

            if (needsUpdate) {
                // Update the registration
                reg.amountPaid = correctAmountPaid;
                reg.balanceAmount = correctBalance;
                reg.totalPayable = correctBalance + (reg.penaltyAmount || 0);
                reg.status = newStatus;
                reg.installments = updatedInstallments;

                await reg.save();
                fixedCount++;
                console.log(`   ✅ FIXED - Updated amounts and installment statuses`);
            } else {
                console.log(`   ✓ Already correct`);
            }
        }

        console.log(`\n\n✅ Fixed ${fixedCount} registrations`);
        console.log(`✓ ${registrations.length - fixedCount} registrations were already correct`);

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('\n🔌 Disconnected from MongoDB');
    }
}

// Run the script
fixInstallmentCalculations();
