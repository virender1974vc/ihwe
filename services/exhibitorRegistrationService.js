const ExhibitorRegistration = require('../models/ExhibitorRegistration');
const Stall = require('../models/Stall');
const pdfGenerator = require('../utils/pdfGenerator');
const emailService = require('../utils/emailService');
const whatsapp = require('../utils/whatsapp');

class ExhibitorRegistrationService {
    async getAllRegistrations() {
        const regs = await ExhibitorRegistration.find()
            .populate('eventId', 'name')
            .sort({ createdAt: -1 });


        return this._enrichRegistrations(regs);
    }

    async getRegistrationById(id) {
        const reg = await ExhibitorRegistration.findById(id).populate('eventId', 'name startDate endDate');
        if (!reg) return null;

        const enriched = await this._enrichRegistrations([reg]);
        return enriched[0];
    }

    async _enrichRegistrations(regs) {
        if (!regs.length) return regs;

        const names = [...new Set(regs.map(r => (r.exhibitorName || '').trim().toLowerCase()))].filter(Boolean);
        const emails = [...new Set(regs.map(r => (r.contact1?.email || '').trim().toLowerCase()))].filter(e => e && e !== 'N/A');
        const mobiles = [...new Set(regs.map(r => (r.contact1?.mobile || '').trim()))].filter(m => m && m !== 'N/A');

        const query = { $or: [] };

        if (names.length) {
            const pattern = names.map(n => n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
            // Loose match: any registration containing the name (with word boundaries)
            query.$or.push({ exhibitorName: { $regex: new RegExp(`(${pattern})`, 'i') } });
        }
        if (emails.length) {
            query.$or.push({ 'contact1.email': { $in: emails } });
            query.$or.push({ 'contact2.email': { $in: emails } });
        }
        if (mobiles.length) {
            query.$or.push({ 'contact1.mobile': { $in: mobiles } });
            query.$or.push({ 'contact2.mobile': { $in: mobiles } });
        }

        if (query.$or.length === 0) return regs;

        const allRelated = await ExhibitorRegistration.find(query).sort({ updatedAt: -1 }).lean();
        const profileFields = ['website', 'address', 'city', 'state', 'country', 'pincode', 'landlineNo', 'fasciaName', 'gstNo', 'panNo', 'natureOfBusiness', 'companyLogoUrl', 'panCardFrontUrl', 'panCardBackUrl', 'aadhaarCardFrontUrl', 'aadhaarCardBackUrl', 'gstCertificateUrl', 'cancelledChequeUrl', 'representativePhotoUrl'];

        const results = regs.map(r => {
            const doc = r;
            const rName = (doc.exhibitorName || '').trim().toLowerCase();
            const rEmail = (doc.contact1?.email || '').trim().toLowerCase();
            const rMobile = (doc.contact1?.mobile || '').trim();

            const masterData = {};
            // We'll map multiple keys to a single 'canonical' key for the UI
            const fieldAliases = {
                'companyLogoUrl': ['companyLogo', 'logo'],
                'panCardFrontUrl': ['panFrontUrl', 'panCardFront', 'panFront'],
                'panCardBackUrl': ['panBackUrl', 'panCardBack', 'panBack'],
                'aadhaarCardFrontUrl': ['aadhaarFrontUrl', 'aadhaarCardFront', 'aadhaarFront'],
                'aadhaarCardBackUrl': ['aadhaarBackUrl', 'aadhaarCardBack', 'aadhaarBack'],
                'gstCertificateUrl': ['gstCertUrl', 'gstCertificate', 'gstCert'],
                'cancelledChequeUrl': ['cancelledCheque'],
                'representativePhotoUrl': ['photoUrl', 'representativePhoto', 'photo']
            };

            allRelated.forEach(sib => {
                const sName = (sib.exhibitorName || '').trim().toLowerCase();
                const sEmail = (sib.contact1?.email || '').trim().toLowerCase();
                const sMobile = (sib.contact1?.mobile || '').trim();
                const sEmail2 = (sib.contact2?.email || '').trim().toLowerCase();
                const sMobile2 = (sib.contact2?.mobile || '').trim();

                const isMatch = (rName && (sName.includes(rName) || rName.includes(sName))) || (rEmail && (sEmail === rEmail || sEmail2 === rEmail)) || (rMobile && (sMobile === rMobile || sMobile2 === rMobile));
                if (isMatch) {
                    profileFields.forEach(f => {
                        // Check canonical key and all aliases
                        const keysToCheck = [f, ...(fieldAliases[f] || [])];
                        keysToCheck.forEach(key => {
                            const val = sib[key];
                            // If we don't have a master value for this field yet, the first one seen is the LATEST (due to sort)
                            if (val && typeof val === 'string' && val !== 'undefined' && val !== 'null' && val.trim() !== '' && !masterData[f]) {
                                masterData[f] = val;
                            }
                        });
                    });
                    
                    // Collect contacts
                    if (sib.contact1?.firstName && (!masterData.contact1 || !masterData.contact1.firstName)) {
                        masterData.contact1 = sib.contact1;
                    }
                    if (sib.contact2?.firstName && (!masterData.contact2 || !masterData.contact2.firstName)) {
                        masterData.contact2 = sib.contact2;
                    }
                }
            });

            // APPLY: Fill missing fields only — NEVER overwrite existing data
            const KYC_IMAGE_FIELDS = ['companyLogoUrl','panCardFrontUrl','panCardBackUrl','aadhaarCardFrontUrl','aadhaarCardBackUrl','gstCertificateUrl','cancelledChequeUrl','representativePhotoUrl'];
            profileFields.forEach(f => {
                const currentVal = doc[f];
                const cleanCurrent = (typeof currentVal === 'string') ? currentVal.trim() : '';
                const isEmpty = !cleanCurrent || cleanCurrent === 'undefined' || cleanCurrent === 'null';

                // For KYC image fields: only fill if EMPTY — never overwrite existing
                // For other fields: fill if empty
                if (isEmpty && masterData[f]) {
                    doc[f] = masterData[f];
                    doc._isEnriched = true;
                }
            });

            // Enrich contacts if missing
            if (!doc.contact1?.firstName && masterData.contact1) {
                doc.contact1 = masterData.contact1;
                doc._isEnriched = true;
            }
            if (!doc.contact2?.firstName && masterData.contact2) {
                doc.contact2 = masterData.contact2;
                doc._isEnriched = true;
            }
            return doc;
        });
        return results;
    }

    async addRegistration(data) {
        const bcrypt = require('bcryptjs');
        const crypto = require('crypto');

        // --- AUTO-GENERATE registrationId (Incremental) ---
        const year = new Date().getFullYear();
        const count = await ExhibitorRegistration.countDocuments({});
        const nextId = (count + 1).toString().padStart(5, '0');
        data.registrationId = `IHWE-EXH-${year}-${nextId}`;
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
            } catch (_) { }
        }

        // --- AUTO-CALCULATE balanceAmount ---
        const total = data.participation?.total || 0;
        const amountPaid = data.amountPaid || 0;
        data.balanceAmount = Math.max(0, total - amountPaid);

        // --- INITIAL PAYMENT HISTORY ---
        if (amountPaid > 0) {
            data.paymentHistory = [{
                amount: amountPaid,
                paymentType: data.paymentType || 'full',
                paymentMode: data.paymentMode || 'online',
                method: data.paymentMode === 'online' ? 'Razorpay' : (data.manualPaymentDetails?.method || 'Manual'),
                transactionId: data.paymentId || data.manualPaymentDetails?.transactionId || '',
                razorpayPaymentId: data.paymentId || '',
                notes: '',
                paidAt: new Date()
            }];
        }

        // --- HANDLE DUPLICATE/RETRY LOGIC ---
        // If a registration exists for the same email and stall in pending/failed state, update it instead of creating new
        const duplicate = await ExhibitorRegistration.findOne({
            'contact1.email': data.contact1?.email,
            'participation.stallNo': data.participation?.stallNo,
            status: { $in: ['pending', 'payment-failed'] }
        });

        let saved;
        if (duplicate) {
            // Update existing record
            saved = await ExhibitorRegistration.findByIdAndUpdate(duplicate._id, data, { new: true });
        } else {
            // Create new record
            const newRegistration = new ExhibitorRegistration(data);
            saved = await newRegistration.save();
        }

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
            } catch (_) { }
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

        // --- PUSH PAYMENT HISTORY if new payment is being recorded ---
        const paymentStatuses = ['paid', 'advance-paid'];
        const wasAlreadyPaid = paymentStatuses.includes(current.status);
        const isNowPaid = paymentStatuses.includes(data.status);
        if (isNowPaid && data.amountPaid != null) {
            const prevPaid = current.amountPaid || 0;
            const newlyPaid = data.amountPaid - prevPaid;
            if (newlyPaid > 0) {
                const historyEntry = {
                    amount: newlyPaid,
                    paymentType: data.paymentType || (wasAlreadyPaid ? 'balance' : 'advance'),
                    paymentMode: data.paymentMode || current.paymentMode || 'manual',
                    method: data.manualPaymentDetails?.method || (data.paymentMode === 'online' ? 'Razorpay' : 'Manual'),
                    transactionId: data.manualPaymentDetails?.transactionId || data.paymentId || '',
                    razorpayPaymentId: data.paymentId || '',
                    notes: data.manualPaymentDetails?.notes || '',
                    paidAt: new Date()
                };
                data.$push = { paymentHistory: historyEntry };
            }
        }

        const updated = await ExhibitorRegistration.findByIdAndUpdate(id, data, { new: true });

        // --- PAYMENT RECEIPT ---
        if (['paid', 'advance-paid'].includes(updated.status) && !['paid', 'advance-paid'].includes(current.status)) {
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

    async syncProfileData(id) {
        const target = await ExhibitorRegistration.findById(id);
        if (!target) throw new Error('Registration not found');

        const cleanName = (target.exhibitorName || '').trim();
        const cleanEmail = (target.contact1?.email || '').trim();
        const cleanMobile = (target.contact1?.mobile || '').trim();


        const query = {
            $or: [
                { exhibitorName: { $regex: new RegExp(`${cleanName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'i') } }
            ]
        };
        if (cleanEmail && cleanEmail !== 'N/A') {
            query.$or.push({ 'contact1.email': { $regex: new RegExp(`${cleanEmail}`, 'i') } });
            query.$or.push({ 'contact2.email': { $regex: new RegExp(`${cleanEmail}`, 'i') } });
        }
        if (cleanMobile && cleanMobile !== 'N/A') {
            query.$or.push({ 'contact1.mobile': cleanMobile });
            query.$or.push({ 'contact2.mobile': cleanMobile });
        }

        const allDocs = await ExhibitorRegistration.find(query).sort({ updatedAt: -1 });

        // Collect BEST data (prefer non-empty) for each field
        const profileFields = ['website', 'address', 'city', 'state', 'country', 'pincode', 'landlineNo', 'fasciaName', 'gstNo', 'panNo', 'natureOfBusiness', 'primaryCategory', 'subCategory'];
        const kycFields = ['companyLogoUrl', 'panCardFrontUrl', 'panCardBackUrl', 'aadhaarCardFrontUrl', 'aadhaarCardBackUrl', 'gstCertificateUrl', 'cancelledChequeUrl', 'representativePhotoUrl'];
        
        const fieldAliases = {
            'companyLogoUrl': ['companyLogo', 'logo'],
            'panCardFrontUrl': ['panFrontUrl', 'panCardFront', 'panFront'],
            'panCardBackUrl': ['panBackUrl', 'panCardBack', 'panBack'],
            'aadhaarCardFrontUrl': ['aadhaarFrontUrl', 'aadhaarCardFront', 'aadhaarFront'],
            'aadhaarCardBackUrl': ['aadhaarBackUrl', 'aadhaarCardBack', 'aadhaarFront'],
            'gstCertificateUrl': ['gstCertUrl', 'gstCertificate', 'gstCert'],
            'cancelledChequeUrl': ['cancelledCheque'],
            'representativePhotoUrl': ['photoUrl', 'representativePhoto', 'photo']
        };

        const masterData = {};

        allDocs.forEach(doc => {
            const allFields = [...profileFields, ...kycFields];
            allFields.forEach(f => {
                const keysToCheck = [f, ...(fieldAliases[f] || [])];
                keysToCheck.forEach(key => {
                    const val = doc[key];
                    if (val && typeof val === 'string' && val !== 'undefined' && val !== 'null' && val.trim() !== '' && !masterData[f]) {
                        masterData[f] = val;
                    }
                });
            });
            // For contacts, take the one with a first name
            if (doc.contact1?.firstName && (!masterData.contact1 || !masterData.contact1.firstName)) {
                masterData.contact1 = doc.contact1;
            }
            if (doc.contact2?.firstName && (!masterData.contact2 || !masterData.contact2.firstName)) {
                masterData.contact2 = doc.contact2;
            }
        });

        if (Object.keys(masterData).length === 0) return target;

        // Apply masterData to all matching registrations
        await ExhibitorRegistration.updateMany(query, { $set: { ...masterData, updatedAt: new Date() } });

        const final = await ExhibitorRegistration.findById(id);
        return {
            final,
            matchedCount: allDocs.length,
            syncedFields: Object.keys(masterData)
        };
    }

    async forceDocsScan(id, customPath) {
        const target = await ExhibitorRegistration.findById(id);
        if (!target) throw new Error('Registration not found');

        const cleanName = (target.exhibitorName || '').trim();
        const cleanEmail = (target.contact1?.email || '').trim();
        const cleanMobile = (target.contact1?.mobile || '').trim();

        const query = {
            $or: [
                { exhibitorName: { $regex: new RegExp(`${cleanName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'i') } }
            ]
        };
        if (cleanEmail && cleanEmail !== 'N/A') {
            query.$or.push({ 'contact1.email': { $regex: new RegExp(`${cleanEmail}`, 'i') } });
            query.$or.push({ 'contact2.email': { $regex: new RegExp(`${cleanEmail}`, 'i') } });
        }
        if (cleanMobile && cleanMobile !== 'N/A') {
            query.$or.push({ 'contact1.mobile': cleanMobile });
            query.$or.push({ 'contact2.mobile': cleanMobile });
        }

        const kycFields = ['companyLogoUrl', 'panCardFrontUrl', 'panCardBackUrl', 'aadhaarCardFrontUrl', 'aadhaarCardBackUrl', 'gstCertificateUrl', 'cancelledChequeUrl', 'representativePhotoUrl'];
        const update = {};
        kycFields.forEach(f => {
            // Priority: provided customPath, else provided target path, else don't update
            if (customPath) {
                update[f] = customPath;
            } else if (target[f]) {
                update[f] = target[f];
            }
        });

        if (Object.keys(update).length === 0) return { final: target, count: 0 };

        await ExhibitorRegistration.updateMany(query, { $set: { ...update, updatedAt: new Date() } });
        const final = await ExhibitorRegistration.findById(id);
        return { final, count: Object.keys(update).length };
    }
}

module.exports = new ExhibitorRegistrationService();
