const ExhibitorRegistration = require('../models/ExhibitorRegistration');
const Stall = require('../models/Stall');
const pdfGenerator = require('../utils/pdfGenerator');
const emailService = require('../utils/emailService');
const whatsapp = require('../utils/whatsapp');

class ExhibitorRegistrationService {
    async getAllRegistrations() {
        return await ExhibitorRegistration.find()
            .populate('eventId', 'name')
            .sort({ createdAt: -1 });
    }

    async getRegistrationById(id) {
        return await ExhibitorRegistration.findById(id).populate('eventId', 'name startDate endDate');
    }

    async addRegistration(data) {
        const bcrypt = require('bcryptjs');
        const crypto = require('crypto');

        // --- AUTO-GENERATE registrationId ---
        const year = new Date().getFullYear();
        const rand = Math.floor(10000 + Math.random() * 90000);
        data.registrationId = `IHWE-EXH-${year}-${rand}`;
        let rawPassword;
        const existing = await ExhibitorRegistration.findOne({ 'contact1.email': data.contact1?.email })
            .select('+password').sort({ createdAt: -1 });
        if (existing && existing.password) {
            rawPassword = crypto.randomBytes(4).toString('hex').toUpperCase();
            data.password = await bcrypt.hash(rawPassword, 10);
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

        // Only book stall and send emails if payment is NOT failed
        if (data.status !== 'payment-failed') {
            if (data.participation?.stallNo) {
                await Stall.findByIdAndUpdate(data.participation.stallNo, {
                    status: 'booked',
                    bookedBy: saved._id
                });
            }

            // --- ASYNC DYNAMIC MESSAGING (Email + WhatsApp) ---
            try {
                const regPdf = await pdfGenerator.generateRegistrationForm(saved);
                const pdfPath = regPdf?.filePath || regPdf;
                if (regPdf?.cloudUrl) {
                    await ExhibitorRegistration.findByIdAndUpdate(saved._id, { registrationPdfUrl: regPdf.cloudUrl });
                }
                await emailService.sendRegistrationConfirmation(saved, pdfPath, rawPassword);
            } catch (err) {
                console.error('Registration Email/WhatsApp Error:', err);
            }
            if (['paid', 'advance-paid'].includes(saved.status)) {
                try {
                    const receiptPdf = await pdfGenerator.generatePaymentSlip(saved);
                    const receiptPath = receiptPdf?.filePath || receiptPdf;
                    if (receiptPdf?.cloudUrl) {
                        await ExhibitorRegistration.findByIdAndUpdate(saved._id, { receiptPdfUrl: receiptPdf.cloudUrl });
                    }
                    await emailService.sendPaymentReceipt(saved, receiptPath);
                } catch (err) {
                    console.error('Payment Receipt Email Error (addRegistration):', err);
                }
            }

            // --- ADMIN ALERT ---
            emailService.sendExhibitorAdminAlert(saved).catch(err => {
                console.error('Exhibitor Admin Alert Error:', err);
            });
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
                const receiptPdf = await pdfGenerator.generatePaymentSlip(updated);
                const receiptPath = receiptPdf?.filePath || receiptPdf;
                if (receiptPdf?.cloudUrl) {
                    await ExhibitorRegistration.findByIdAndUpdate(id, { receiptPdfUrl: receiptPdf.cloudUrl });
                }
                await emailService.sendPaymentReceipt(updated, receiptPath);
            } catch (err) {
                console.error('Payment Receipt Email Error:', err);
            }
        }

        // --- APPROVED ---
        if (updated.status === 'approved' && current.status !== 'approved') {
            try { 
                await emailService.sendApprovalEmail(updated); 
                const msg = `Congratulations ${updated.exhibitorName}! 👋\n\nYour registration for IHWE 2026 has been APPROVED. ✅\n\nPlease login to the Exhibitor Portal to complete the payment and secure your stall ${updated.participation?.stallFor || ''}.\n\n- Team Namo Gange`;
                whatsapp.sendWhatsAppMessage(updated.contact1.mobile, msg, 'Exhibitor Approved');
            } catch (err) { console.error('Approval Notification Error:', err); }
        }

        // --- CONFIRMED ---
        if (updated.status === 'confirmed' && current.status !== 'confirmed') {
            try { 
                await emailService.sendConfirmationEmail(updated); 
                const msg = `Booking Confirmed! 🎊\n\nDear ${updated.exhibitorName}, your stall booking for IHWE 2026 is now CONFIRMED. We look forward to seeing you at the expo!\n\n- Team Namo Gange`;
                whatsapp.sendWhatsAppMessage(updated.contact1.mobile, msg, 'Exhibitor Confirmed');
            } catch (err) { console.error('Confirmation Notification Error:', err); }
        }

        // --- REJECTED ---
        if (updated.status === 'rejected' && current.status !== 'rejected') {
            try { 
                await emailService.sendRejectionEmail(updated);
                const msg = `Hello ${updated.exhibitorName}. We regret to inform you that your registration application for IHWE 2026 has not been approved at this time. Please contact our support for more details.`;
                whatsapp.sendWhatsAppMessage(updated.contact1.mobile, msg, 'Exhibitor Rejected');
            } catch (err) { console.error('Rejection Notification Error:', err); }
        }

        return updated;
    }

    async deleteRegistration(id) {
        const reg = await ExhibitorRegistration.findById(id);
        if (!reg) throw new Error('Registration not found');

        // Only free stall if payment was not failed (failed entries never booked a stall)
        if (reg.status !== 'payment-failed' && reg.participation?.stallNo) {
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
