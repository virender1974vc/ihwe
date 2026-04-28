const mongoose = require('mongoose');
const ExhibitorRegistration = require('../models/ExhibitorRegistration');
require('dotenv').config();

/**
 * Fix a single registration's installment calculations
 * Usage: node scripts/fixSingleRegistration.js <registrationId>
 */

async function fixSingleRegistration() {
    try {
        const registrationId = process.argv[2];
        
        if (!registrationId) {
            console.log('❌ Please provide a registration ID');
            console.log('Usage: node scripts/fixSingleRegistration.js <registrationId>');
            console.log('Example: node scripts/fixSingleRegistration.js 9IHWE-EX-2026-8001');
            process.exit(1);
        }

        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB\n');

        // Find registration by registrationId or _id
        let reg = await ExhibitorRegistration.findOne({ registrationId });
        
        if (!reg) {
            reg = await ExhibitorRegistration.findById(registrationId);
        }

        if (!reg) {
            console.log(`❌ Registration not found: ${registrationId}`);
            process.exit(1);
        }

        console.log('═══════════════════════════════════════════════════════════');
        console.log(`🔧 FIXING: ${reg.registrationId} - ${reg.exhibitorName}`);
        console.log('═══════════════════════════════════════════════════════════\n');

        const netPayable = reg.financeBreakdown?.netPayable || reg.participation?.total || 0;
        console.log(`📊 Net Payable: ₹${netPayable.toLocaleString('en-IN')}`);

        // Calculate total paid from payment history
        const totalPaidFromHistory = (reg.paymentHistory || []).reduce((sum, p) => sum + (p.amount || 0), 0);
        console.log(`💰 Total Paid (from history): ₹${totalPaidFromHistory.toLocaleString('en-IN')}`);

        // Calculate total paid from installments
        const totalPaidInInstallments = (reg.installments || []).reduce((sum, inst) => sum + (inst.paidAmount || 0), 0);
        console.log(`📦 Total Paid (from installments): ₹${totalPaidInInstallments.toLocaleString('en-IN')}`);

        // Use the maximum as the correct amount
        const correctAmountPaid = Math.max(totalPaidFromHistory, totalPaidInInstallments, reg.amountPaid || 0);
        console.log(`✅ Correct Amount Paid: ₹${correctAmountPaid.toLocaleString('en-IN')}`);

        // Calculate correct balance
        const correctBalance = Math.max(0, netPayable - correctAmountPaid);
        console.log(`💵 Correct Balance: ₹${correctBalance.toLocaleString('en-IN')}\n`);

        // Update installments
        if (reg.installments && reg.installments.length > 0) {
            console.log('📦 UPDATING INSTALLMENTS:\n');
            
            const sortedInstallments = [...reg.installments].sort((a, b) => a.installmentNumber - b.installmentNumber);
            let remainingPaid = correctAmountPaid;

            for (const inst of sortedInstallments) {
                const dueAmount = inst.dueAmount || 0;
                let paidAmount = 0;
                let status = 'pending';
                let oldStatus = inst.status;
                let oldPaidAmount = inst.paidAmount || 0;

                if (remainingPaid >= dueAmount) {
                    paidAmount = dueAmount;
                    status = 'paid';
                    remainingPaid -= dueAmount;
                } else if (remainingPaid > 0) {
                    paidAmount = remainingPaid;
                    status = 'partial';
                    remainingPaid = 0;
                } else {
                    paidAmount = 0;
                    status = 'pending';
                }

                // Check if overdue
                if (status !== 'paid' && inst.dueDate && new Date(inst.dueDate) < new Date()) {
                    status = 'overdue';
                }

                inst.paidAmount = paidAmount;
                inst.status = status;
                if (paidAmount > 0 && !inst.paidAt) {
                    inst.paidAt = new Date();
                }

                const statusIcon = status === 'paid' ? '✅' : status === 'partial' ? '🟡' : status === 'overdue' ? '🔴' : '⚪';
                console.log(`   ${statusIcon} ${inst.label}`);
                console.log(`      Due: ₹${dueAmount.toLocaleString('en-IN')}`);
                console.log(`      Paid: ₹${oldPaidAmount.toLocaleString('en-IN')} → ₹${paidAmount.toLocaleString('en-IN')}`);
                console.log(`      Status: ${oldStatus} → ${status}`);
                console.log('');
            }
        }

        // Determine overall status
        let newStatus = reg.status;
        if (correctBalance <= 0) {
            newStatus = 'paid';
        } else if (correctAmountPaid > 0) {
            newStatus = 'advance-paid';
        }

        console.log('📝 UPDATING REGISTRATION:\n');
        console.log(`   Amount Paid: ₹${(reg.amountPaid || 0).toLocaleString('en-IN')} → ₹${correctAmountPaid.toLocaleString('en-IN')}`);
        console.log(`   Balance: ₹${(reg.balanceAmount || 0).toLocaleString('en-IN')} → ₹${correctBalance.toLocaleString('en-IN')}`);
        console.log(`   Status: ${reg.status} → ${newStatus}`);
        console.log(`   Total Payable: ₹${(reg.totalPayable || 0).toLocaleString('en-IN')} → ₹${(correctBalance + (reg.penaltyAmount || 0)).toLocaleString('en-IN')}\n`);

        // Update the registration
        reg.amountPaid = correctAmountPaid;
        reg.balanceAmount = correctBalance;
        reg.totalPayable = correctBalance + (reg.penaltyAmount || 0);
        reg.status = newStatus;

        await reg.save();

        console.log('✅ SUCCESSFULLY FIXED!\n');
        console.log('═══════════════════════════════════════════════════════════\n');
        console.log('💡 Tip: Run checkRegistration.js to verify the fix:');
        console.log(`   node scripts/checkRegistration.js ${reg.registrationId}\n`);

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await mongoose.disconnect();
    }
}

fixSingleRegistration();
