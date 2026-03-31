const ExhibitorRegistration = require('../models/ExhibitorRegistration');
const Stall = require('../models/Stall');
const pdfGenerator = require('../utils/pdfGenerator');
const emailService = require('../utils/emailService');

class ExhibitorRegistrationService {
    async getAllRegistrations() {
        return await ExhibitorRegistration.find()
            .populate('eventId', 'name')
            .sort({ createdAt: -1 });
    }

    async addRegistration(data) {
        const bcrypt = require('bcryptjs');
        const crypto = require('crypto');

        // --- REUSE PASSWORD if same email already registered ---
        let rawPassword;
        const existing = await ExhibitorRegistration.findOne({ 'contact1.email': data.contact1?.email })
            .select('+password').sort({ createdAt: -1 });
        if (existing && existing.password) {
            // Keep same hashed password, generate new raw for email display
            rawPassword = null; // won't resend password in email
            data.password = existing.password;
        } else {
            rawPassword = crypto.randomBytes(4).toString('hex').toUpperCase();
            data.password = await bcrypt.hash(rawPassword, 10);
        }

        // --- AUTO-POPULATE stallFor from Stall model ---
        if (data.participation?.stallNo) {
            try {
                const stallDoc = await Stall.findById(data.participation.stallNo).select('stallNumber');
                if (stallDoc) data.participation.stallFor = stallDoc.stallNumber;
            } catch (_) {}
        }

        // --- AUTO-CALCULATE balanceAmount ---
        const total = data.participation?.total || 0;
        const amountPaid = data.amountPaid || 0;
        data.balanceAmount = Math.max(0, total - amountPaid);

        const newRegistration = new ExhibitorRegistration(data);
        const saved = await newRegistration.save();

        if (data.participation?.stallNo) {
            await Stall.findByIdAndUpdate(data.participation.stallNo, {
                status: 'booked',
                bookedBy: saved._id
            });
        }

        // --- ASYNC PDF & EMAIL ---
        try {
            const pdfPath = await pdfGenerator.generateRegistrationForm(saved);
            await emailService.sendRegistrationConfirmation(saved, pdfPath, rawPassword);
        } catch (err) {
            console.error('Registration Email Error:', err);
        }

        return saved;
    }

    async updateRegistration(id, data) {
        const current = await ExhibitorRegistration.findById(id);

        // --- AUTO-POPULATE stallFor if stallNo changed ---
        if (data.participation?.stallNo && data.participation.stallNo !== current.participation?.stallNo?.toString()) {
            try {
                const stallDoc = await Stall.findById(data.participation.stallNo).select('stallNumber');
                if (stallDoc) data.participation.stallFor = stallDoc.stallNumber;
            } catch (_) {}
            // Free old stall
            if (current.participation?.stallNo) {
                await Stall.findByIdAndUpdate(current.participation.stallNo, { status: 'available', bookedBy: null });
            }
            // Book new stall
            await Stall.findByIdAndUpdate(data.participation.stallNo, { status: 'booked', bookedBy: id });
        }

        // --- AUTO-CALCULATE balanceAmount ---
        const total = data.participation?.total ?? current.participation?.total ?? 0;
        const amountPaid = data.amountPaid ?? current.amountPaid ?? 0;
        data.balanceAmount = Math.max(0, total - amountPaid);

        const updated = await ExhibitorRegistration.findByIdAndUpdate(id, data, { new: true });

        // --- PAYMENT RECEIPT ---
        const paymentStatuses = ['paid', 'advance-paid'];
        if (paymentStatuses.includes(updated.status) && !paymentStatuses.includes(current.status)) {
            try {
                const pdfPath = await pdfGenerator.generatePaymentSlip(updated);
                await emailService.sendPaymentReceipt(updated, pdfPath);
            } catch (err) {
                console.error('Payment Receipt Email Error:', err);
            }
        }

        // --- APPROVED ---
        if (updated.status === 'approved' && current.status !== 'approved') {
            try { await emailService.sendApprovalEmail(updated); } catch (err) { console.error('Approval Email Error:', err); }
        }

        // --- CONFIRMED ---
        if (updated.status === 'confirmed' && current.status !== 'confirmed') {
            try { await emailService.sendConfirmationEmail(updated); } catch (err) { console.error('Confirmation Email Error:', err); }
        }

        // --- REJECTED ---
        if (updated.status === 'rejected' && current.status !== 'rejected') {
            try { await emailService.sendRejectionEmail(updated); } catch (err) { console.error('Rejection Email Error:', err); }
        }

        return updated;
    }

    async deleteRegistration(id) {
        const reg = await ExhibitorRegistration.findById(id);
        if (!reg) throw new Error('Registration not found');

        // Free stall
        if (reg.participation?.stallNo) {
            await Stall.findByIdAndUpdate(reg.participation.stallNo, { status: 'available', bookedBy: null });
        }

        // Archive payment snapshot to console/log before delete (soft audit trail)
        if (reg.amountPaid > 0) {
            console.log(`[PAYMENT ARCHIVE] Deleting registration ${id} | Exhibitor: ${reg.exhibitorName} | Paid: ${reg.amountPaid} | Receipt: ${reg.receiptUrl || 'none'} | TxnId: ${reg.paymentId || 'none'}`);
        }

        return await ExhibitorRegistration.findByIdAndDelete(id);
    }
}

module.exports = new ExhibitorRegistrationService();
