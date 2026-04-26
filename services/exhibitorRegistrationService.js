const ExhibitorRegistration = require('../models/ExhibitorRegistration');
const Stall = require('../models/Stall');
const pdfGenerator = require('../utils/pdfGenerator');
const emailService = require('../utils/emailService');
const path = require('path');

class ExhibitorRegistrationService {
    async getAllRegistrations() {
        const regs = await ExhibitorRegistration.find()
            .populate('eventId', 'name paymentPlans')
            .sort({ createdAt: -1 });


        return this._enrichRegistrations(regs);
    }

    async getRegistrationById(id) {
        const reg = await ExhibitorRegistration.findById(id).populate('eventId', 'name startDate endDate paymentPlans');
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
            const KYC_IMAGE_FIELDS = ['companyLogoUrl', 'panCardFrontUrl', 'panCardBackUrl', 'aadhaarCardFrontUrl', 'aadhaarCardBackUrl', 'gstCertificateUrl', 'cancelledChequeUrl', 'representativePhotoUrl'];
            profileFields.forEach(f => {
                const currentVal = doc[f];
                const cleanCurrent = (typeof currentVal === 'string') ? currentVal.trim() : '';
                const isEmpty = !cleanCurrent || cleanCurrent === 'undefined' || cleanCurrent === 'null';
                if (KYC_IMAGE_FIELDS.includes(f)) return;

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
        const year = new Date().getFullYear();
        // Use a persistent counter to ensure sequential IDs starting from 8001
        const Counter = require('../models/visitor/CounterModel');
        // Check if counter exists, if not initialize at 8000 so next is 8001
        let counterRecord = await Counter.findOne({ type: `exhibitor-v2-${year}` });
        if (!counterRecord) {
            counterRecord = await Counter.findOneAndUpdate(
                { type: `exhibitor-v2-${year}` },
                { $setOnInsert: { seq: 8000 } },
                { upsert: true, new: true }
            );
        }

        let counter = await Counter.findOneAndUpdate(
            { type: `exhibitor-v2-${year}` },
            { $inc: { seq: 1 } },
            { new: true }
        );

        let currentSeq = counter.seq;
        let isUnique = false;

        while (!isUnique) {
            const nextIdStr = currentSeq.toString().padStart(4, '0');
            const candidateId = `9IHWE-EX-${year}-${nextIdStr}`;
            const existingDoc = await ExhibitorRegistration.findOne({ registrationId: candidateId }).select('_id').lean();

            if (!existingDoc) {
                data.registrationId = candidateId;
                isUnique = true;
                if (currentSeq > counter.seq) {
                    await Counter.findOneAndUpdate({ type: `exhibitor-v2-${year}` }, { seq: currentSeq });
                }
            } else {
                currentSeq++;
            }
        }
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
        if (data.participation?.stallNo) {
            try {
                const stallDoc = await Stall.findById(data.participation.stallNo).select('stallNumber');
                if (stallDoc) data.participation.stallFor = stallDoc.stallNumber;
            } catch (_) { }
        }
        const invoiceTotal = data.participation?.total || 0;
        const tdsAmount = data.financeBreakdown?.tdsAmount || 0;
        const netPayable = invoiceTotal - tdsAmount;
        const amountPaid = data.amountPaid || 0;
        data.balanceAmount = Math.max(0, Math.round(netPayable - amountPaid));

        // --- AUTO-GENERATE INSTALLMENTS based on payment plan ---
        const Event = require('../models/Event');
        const eventDoc = data.eventId ? await Event.findById(data.eventId).lean() : null;
        const paymentPlans = eventDoc?.paymentPlans || [];
        const chosenPlanId = data.paymentPlanType || 'full';
        const chosenPlan = paymentPlans.find(p => p.id === chosenPlanId);
        const isFull = chosenPlanId === 'full' || (chosenPlan && Number(chosenPlan.percentage) === 100);

        if (!isFull && paymentPlans.length > 0) {
            // Generate installments for all phases
            // Each phase's dueAmount = (this phase % - previous phase %) of netPayable
            // e.g. Phase1=25%, Phase2=50%, Phase3=75%
            //   → Phase1 pays 25%, Phase2 pays 25% (50-25), Phase3 pays 25% (75-50)
            // Last phase always gets the exact remaining to avoid rounding drift
            const installmentPlans = paymentPlans.filter(p => p.id !== 'full' && Number(p.percentage) < 100);
            const today = new Date();

            // Sort by percentage ascending to ensure correct cumulative calculation
            const sortedPlans = [...installmentPlans].sort((a, b) => Number(a.percentage) - Number(b.percentage));

            let cumulativePaid = 0;
            const installmentAmounts = sortedPlans.map((plan, idx) => {
                const thisPct = Number(plan.percentage);
                const isLast = idx === sortedPlans.length - 1;
                if (isLast) {
                    // Last installment = exact remaining balance (covers any rounding + remaining %)
                    return netPayable - cumulativePaid;
                }
                // Cumulative approach: Phase amount = round(total × thisPct%) - already assigned
                const cumulativeTarget = Math.round(netPayable * thisPct / 100);
                const amount = cumulativeTarget - cumulativePaid;
                cumulativePaid = cumulativeTarget;
                return amount;
            });
            // No safety needed — last phase already gets exact remainder

            data.installments = sortedPlans.map((plan, idx) => {
                const dueDate = plan.dueDate
                    ? new Date(plan.dueDate)
                    : new Date(today.getTime() + (idx + 1) * 30 * 24 * 60 * 60 * 1000);
                const dueAmount = installmentAmounts[idx];
                const isPaidInstallment = idx === 0 && amountPaid > 0 && chosenPlanId === plan.id;
                return {
                    installmentNumber: idx + 1,
                    planId: plan.id,
                    label: plan.label || `Installment ${idx + 1}`,
                    percentage: Number(plan.percentage),
                    dueAmount,
                    paidAmount: isPaidInstallment ? amountPaid : 0,
                    status: isPaidInstallment ? 'paid' : 'pending',
                    dueDate,
                    paidAt: isPaidInstallment ? new Date() : null
                };
            });
            // Set paymentDueDate to first unpaid installment's due date
            const firstUnpaid = data.installments.find(i => i.status !== 'paid');
            if (firstUnpaid) data.paymentDueDate = firstUnpaid.dueDate;
        } else {
            // Full payment - set due date to 7 days from now
            if (!data.paymentDueDate) {
                const dueDate = new Date();
                dueDate.setDate(dueDate.getDate() + 7);
                data.paymentDueDate = dueDate;
            }
            data.installments = [];
        }

        // Set totalPayable
        data.totalPayable = data.balanceAmount;

        // --- INITIAL PAYMENT HISTORY ---
        if (amountPaid > 0) {
            const isFull = data.balanceAmount === 0;
            data.paymentHistory = [{
                amount: amountPaid,
                paymentType: data.paymentType || (isFull ? 'full' : 'installment'),
                paymentMode: data.paymentMode || 'online',
                method: data.paymentMode === 'online' ? 'Razorpay' : (data.manualPaymentDetails?.method || 'Manual'),
                transactionId: data.paymentId || data.manualPaymentDetails?.transactionId || '',
                razorpayPaymentId: data.paymentId || '',
                notes: '',
                paidAt: new Date()
            }];
        }
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
                const templateData = await emailService.getExhibitorTemplateData();
                const pdfOptions = {
                    headerImage: templateData?.headerImage ? path.resolve(__dirname, '..', templateData.headerImage.replace(/^\//, '')) : null,
                    footerImage: templateData?.footerImage ? path.resolve(__dirname, '..', templateData.footerImage.replace(/^\//, '')) : null
                };

                const regPdf = await pdfGenerator.generateRegistrationForm(saved, pdfOptions);
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
                    const templateData = await emailService.getExhibitorTemplateData();
                    const pdfOptions = {
                        headerImage: templateData?.headerImage ? path.resolve(__dirname, '..', templateData.headerImage.replace(/^\//, '')) : null,
                        footerImage: templateData?.footerImage ? path.resolve(__dirname, '..', templateData.footerImage.replace(/^\//, '')) : null
                    };

                    const receiptPdf = await pdfGenerator.generatePaymentSlip(saved, pdfOptions);
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
        let stallChanged = false;
        if (data.participation?.stallNo && data.participation.stallNo !== current.participation?.stallNo?.toString()) {
            stallChanged = true;
            try {
                const stallDoc = await Stall.findById(data.participation.stallNo).select('stallNumber area incrementPercentage discountPercentage');
                if (stallDoc) {
                    data.participation.stallFor = stallDoc.stallNumber;
                    const rate = data.participation?.rate || current.participation?.rate || 0;
                    const baseCost = stallDoc.area * rate;
                    const plInc = Math.round(baseCost * (stallDoc.incrementPercentage || 0) / 100);
                    const newGross = baseCost + plInc;
                    const stallDiscPct = stallDoc.discountPercentage || 0;
                    const stallDiscAmt = Math.round(newGross * stallDiscPct / 100);
                    data._newGross = newGross;
                    data._stallDiscountPercent = stallDiscPct;
                    data._stallDiscountAmount = stallDiscAmt;
                }
            } catch (_) { }
            // Free old stall
            if (current.participation?.stallNo) {
                await Stall.findByIdAndUpdate(current.participation.stallNo, { status: 'available', bookedBy: null });
            }
            // Book new stall
            await Stall.findByIdAndUpdate(data.participation.stallNo, { status: 'booked', bookedBy: id });
        }

        // --- AUTO-CALCULATE balanceAmount (will be recalculated below if finance recalc runs) ---
        const invoiceTotal = data.participation?.total ?? current.participation?.total ?? 0;
        const tdsAmountCurrent = data.financeBreakdown?.tdsAmount ?? current.financeBreakdown?.tdsAmount ?? 0;
        const netPayableCurrent = invoiceTotal - tdsAmountCurrent;
        const amountPaid = data.amountPaid ?? current.amountPaid ?? 0;
        data.balanceAmount = Math.max(0, Math.round(netPayableCurrent - amountPaid));

        // Only recalc if grossAmount is missing (new record from old schema) or TDS/plan/stall explicitly changed
        const needsFinanceRecalc =
            stallChanged ||
            !current.financeBreakdown?.grossAmount ||
            (data.chosenTdsPercent !== undefined && data.chosenTdsPercent !== current.chosenTdsPercent) ||
            (data.paymentPlanType && data.paymentPlanType !== current.paymentPlanType);

        if (needsFinanceRecalc) {
            const Settings = require('../models/Settings');
            const settings = await Settings.findOne();
            const plan = data.paymentPlanType || current.paymentPlanType || 'full';

            // If stall changed, use newly calculated gross; otherwise use stored grossAmount
            const gross = data._newGross || current.financeBreakdown?.grossAmount || data.financeBreakdown?.grossAmount || 0;
            const stallDiscPct = data._stallDiscountPercent ?? current.financeBreakdown?.stallDiscountPercent ?? 0;
            const stallDiscAmt = data._stallDiscountAmount ?? current.financeBreakdown?.stallDiscountAmount ?? 0;
            const sub1 = gross - stallDiscAmt;

            let isFullPayment = (plan === 'full');
            const Event = require('../models/Event');
            const event = await Event.findById(current.eventId);
            if (event?.paymentPlans) {
                const selectedPlan = event.paymentPlans.find(p => p.id === plan);
                if (selectedPlan && (Number(selectedPlan.percentage) === 100)) isFullPayment = true;
            }

            const discP = isFullPayment ? (settings?.fullPaymentDiscount || 5) : 0;
            const discA = Math.round(sub1 * (discP / 100));
            const sub = sub1 - discA;
            const gstA = Math.round(sub * 0.18);
            const tdsP = (data.chosenTdsPercent !== undefined) ? data.chosenTdsPercent : (current.chosenTdsPercent || 0);
            const tdsA = Math.round(sub * (tdsP / 100));
            const invoiceTot = sub + gstA;
            const net = invoiceTot - tdsA;

            if (!data.participation) data.participation = { ...current.participation.toObject() };
            data.participation.amount = sub;
            data.participation.total = invoiceTot;
            data.balanceAmount = Math.max(0, Math.round(net - amountPaid));

            data.financeBreakdown = {
                grossAmount: gross,
                stallDiscountPercent: stallDiscPct,
                stallDiscountAmount: stallDiscAmt,
                subtotal1: Math.round(sub1),
                discountPercent: discP,
                discountAmount: discA,
                subtotal: sub,
                gstAmount: gstA,
                tdsPercent: tdsP,
                tdsAmount: tdsA,
                netPayable: net
            };

            // cleanup temp fields
            delete data._newGross;
            delete data._stallDiscountPercent;
            delete data._stallDiscountAmount;
        }
        const paymentStatuses = ['paid', 'advance-paid'];
        const wasAlreadyPaid = paymentStatuses.includes(current.status);
        const isNowPaid = paymentStatuses.includes(data.status);
        if (isNowPaid && data.amountPaid != null) {
            const prevPaid = current.amountPaid || 0;
            const newlyPaid = data.amountPaid - prevPaid;
            if (newlyPaid > 0) {
                const historyEntry = {
                    amount: newlyPaid,
                    paymentType: data.paymentType || (wasAlreadyPaid ? 'installment' : 'installment'),
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
        const newlyReceived = (data.amountPaid != null && data.amountPaid > (current.amountPaid || 0));
        const statusJustChanged = (['paid', 'advance-paid'].includes(updated.status) && !['paid', 'advance-paid'].includes(current.status));

        if ((statusJustChanged || newlyReceived) && ['paid', 'advance-paid'].includes(updated.status)) {
            try {
                const templateData = await emailService.getExhibitorTemplateData();
                const pdfOptions = {
                    headerImage: templateData?.headerImage ? path.resolve(__dirname, '..', templateData.headerImage.replace(/^\//, '')) : null,
                    footerImage: templateData?.footerImage ? path.resolve(__dirname, '..', templateData.footerImage.replace(/^\//, '')) : null
                };

                // Generate receipt for the latest payment
                const latestPaymentIdx = (updated.paymentHistory?.length || 1) - 1;
                const receiptPdf = await pdfGenerator.generatePaymentSlip(updated, { ...pdfOptions, paymentIndex: latestPaymentIdx });
                const receiptPath = receiptPdf?.filePath || receiptPdf;

                if (receiptPdf?.cloudUrl) {
                    // Save to main receiptPdfUrl AND to the latest paymentHistory entry
                    const updateObj = { receiptPdfUrl: receiptPdf.cloudUrl };
                    if (latestPaymentIdx >= 0) {
                        updateObj[`paymentHistory.${latestPaymentIdx}.receiptPdfUrl`] = receiptPdf.cloudUrl;
                    }
                    await ExhibitorRegistration.findByIdAndUpdate(id, { $set: updateObj });
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
            } catch (err) { console.error('Approval Notification Error:', err); }
        }

        // --- CONFIRMED ---
        if (updated.status === 'confirmed' && current.status !== 'confirmed') {
            try {
                await emailService.sendConfirmationEmail(updated);
            } catch (err) { console.error('Confirmation Notification Error:', err); }
        }

        // --- REJECTED ---
        if (updated.status === 'rejected' && current.status !== 'rejected') {
            try {
                await emailService.sendRejectionEmail(updated);
            } catch (err) { console.error('Rejection Notification Error:', err); }
        }

        return updated;
    }

    async deleteRegistration(id) {
        const reg = await ExhibitorRegistration.findById(id);
        if (!reg) throw new Error('Registration not found');
        if (reg.status !== 'payment-failed' && reg.participation?.stallNo) {
            await Stall.findByIdAndUpdate(reg.participation.stallNo, { status: 'available', bookedBy: null });
        }
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
