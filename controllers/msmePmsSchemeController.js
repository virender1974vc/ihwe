const MsmePmsScheme = require('../models/MsmePmsScheme');
const MsmePmsPage = require('../models/MsmePmsPage');
const ExhibitorRegistration = require('../models/ExhibitorRegistration');
const Company = require('../models/Company');
const User = require('../models/User');
const mongoose = require('mongoose');
const cloudinary = require('cloudinary').v2;
const aiDocumentVerificationService = require('../services/aiDocumentVerificationService');

// Same Industry/Sector choices offered on the admin Book a Stand form
// (IHWE-admin/src/pages/BookAStand.jsx) — kept in sync so the AI's
// bestMatchingCategory suggestion always lands on a real, selectable option.
const INDUSTRY_SECTOR_OPTIONS = [
    'Medical & Healthcare',
    'AYUSH & Traditional Medicine',
    'Wellness, Fitness & Lifestyle',
    'Nutrition, Organic & Health Foods',
    'Beauty, Personal Care & Aesthetic Wellness',
    'Mental Health, Yoga & Spiritual Wellness',
    'Medical Technology, Diagnostics & Devices',
    'Institutions, Government Bodies & Startups',
];

// The 3 admin-facing tracking stages shown as a stepper on the MSME PMS
// application tracking page.
const PMS_STAGE_LABELS = [
    'Application & Submission',
    'Claim Documents',
    'Claim & Reimbursement',
];

// The 14 documents required for an MSME PMS claim, shown as a grid on the
// admin tracking page — distinct from REQUIRED_DOCUMENTS below (that list is
// for the exhibitor's own 4-step self-service application editor and must
// not change, or it breaks the already-live MSMEPMSDocumentsUpload flow).
// Whether a given document actually applies to a given exhibitor (e.g.
// Category Certificate only for SC/ST/OBC applicants) is a per-claim call an
// admin makes via documents[].notApplicable, not a fixed list here.
const PMS_CLAIM_DOCUMENT_TYPES = [
    'claimForm', 'onlineApplicationPrintout', 'udyam', 'taxInvoice', 'paymentProof',
    'participationProof', 'bankMandate', 'cheque', 'preReceipt', 'pfmsDetails',
    'gst', 'pan', 'categoryCertificate', 'otherSupportingDocument',
];

const REQUIRED_DOCUMENTS = ['udyam', 'gst', 'pan', 'aadhaar', 'cheque', 'statement'];
const DOCUMENT_TYPES = new Set([...REQUIRED_DOCUMENTS, 'passbook', 'hotelInvoice', 'hotelPayment', 'travelExpense', 'travelInvoice', 'courier', 'marketing', ...PMS_CLAIM_DOCUMENT_TYPES]);
const DOCUMENT_LABELS = {
    udyam: 'Udyam Registration Certificate',
    gst: 'GST Certificate',
    pan: 'PAN Card',
    aadhaar: 'Aadhaar Card',
    cheque: 'Cancelled Cheque',
    statement: 'Bank Statement',
    passbook: 'Bank Passbook',
    hotelInvoice: 'Hotel Invoice',
    hotelPayment: 'Hotel Payment Proof',
    travelExpense: 'Travel Expense Proof',
    travelInvoice: 'Travel Invoice',
    courier: 'Courier / Logistics Invoice',
    marketing: 'Marketing / Printing Invoice',
    claimForm: 'PMS Claim Form',
    onlineApplicationPrintout: 'MSME Portal Application Printout',
    taxInvoice: 'Tax Invoice / Bills',
    paymentProof: 'Payment Proof',
    participationProof: 'Participation Proof (Photos / Certificate)',
    bankMandate: 'Bank Details / Mandate Form',
    preReceipt: 'Pre-Receipt / Advance Received Proof (if any)',
    pfmsDetails: 'PFMS / Other Details (if applicable)',
    categoryCertificate: 'Category Certificate (SC/ST/OBC - if applicable)',
    otherSupportingDocument: 'Any Other Supporting Document',
};

// Same cleanup used by clientDocumentController.js for the general Document
// Center — an AI-rejected upload shouldn't leave an orphaned file sitting in
// Cloudinary.
async function deleteUploadedFile(fileUrl) {
    if (!fileUrl || !fileUrl.includes('cloudinary.com')) return;
    try {
        const urlParts = fileUrl.split('/upload/');
        if (urlParts.length <= 1) return;
        let publicId = urlParts[1];
        if (publicId.match(/^v\d+\//)) publicId = publicId.replace(/^v\d+\//, '');
        publicId = publicId.substring(0, publicId.lastIndexOf('.')) || publicId;
        await cloudinary.uploader.destroy(publicId, { resource_type: 'image' }).catch(() => {});
        await cloudinary.uploader.destroy(publicId, { resource_type: 'raw' }).catch(() => {});
    } catch (err) {
        console.error('MSME PMS document cleanup error:', err.message);
    }
}
const REQUIRED_APPLICANT_FIELDS = ['companyName', 'udyamRegNo', 'gstNumber', 'panNumber', 'organizationType', 'yearOfEstablishment', 'msmeCategory', 'contactName', 'designation', 'mobileNumber', 'addressLine1', 'country', 'state', 'city', 'pincode'];
const REQUIRED_BANK_FIELDS = ['accountHolderName', 'bankName', 'branchName', 'accountNumber', 'ifscCode', 'accountType'];
const requiredDocumentsFor = application => {
    const required = [...REQUIRED_DOCUMENTS];
    const expenses = new Set(application.selectedExpenses || []);
    if (expenses.has('Hotel Stay')) required.push('hotelInvoice', 'hotelPayment');
    if (expenses.has('Travel')) required.push('travelExpense', 'travelInvoice');
    if (expenses.has('Courier')) required.push('courier');
    if (expenses.has('Marketing Material')) required.push('marketing');
    return required;
};

const missingFields = (data, fields) => fields.filter(field => data?.[field] === undefined || data?.[field] === null || String(data[field]).trim() === '');
const makeApplicationId = id => `PMS-IHWE-${new Date().getFullYear()}-${String(id).slice(-6).toUpperCase()}`;

async function findExhibitorByIdentifier(identifier) {
    if (!mongoose.isValidObjectId(identifier)) return null;
    let exhibitor = await ExhibitorRegistration.findById(identifier).select('_id');
    if (!exhibitor) {
        const company = await Company.findById(identifier).select('exhibitorRegistrationId');
        if (company?.exhibitorRegistrationId) {
            exhibitor = { _id: company.exhibitorRegistrationId };
        } else {
            exhibitor = await ExhibitorRegistration.findOne({ clientId: identifier }).select('_id');
        }
    }
    return exhibitor;
}

async function findApplicationByIdentifier(identifier) {
    let application = mongoose.isValidObjectId(identifier)
        ? await MsmePmsScheme.findById(identifier)
        : await MsmePmsScheme.findOne({ applicationId: identifier });
    if (application) return application;

    const exhibitor = await findExhibitorByIdentifier(identifier);

    if (!exhibitor?._id) return null;
    return MsmePmsScheme.findOne({ exhibitorId: exhibitor._id, applicationType: 'exhibitor_claim' });
}

async function makeAdminApplicationPayload(application) {
    const payload = application.toObject ? application.toObject() : application;
    if (!payload?.exhibitorId) return payload;
    const exhibitor = await ExhibitorRegistration.findById(payload.exhibitorId)
        .populate('eventId')
        .lean();
    if (!exhibitor) return payload;

    const contact = exhibitor.contact1 || {};
    const contactName = [contact.firstName, contact.lastName].filter(Boolean).join(' ');
    const lastPayment = [...(exhibitor.paymentHistory || [])].sort((a, b) => new Date(b.paidAt || 0) - new Date(a.paidAt || 0))[0];
    const invoiceValue = Number(exhibitor.financeBreakdown?.netPayable || exhibitor.totalPayable || exhibitor.participation?.total || 0);
    const existingClaim = payload.claim || exhibitor.claim || {};
    const stallCharges = Number(existingClaim.stallCharges ?? invoiceValue ?? 0);
    const hotelStay = Number(existingClaim.hotelStay || 0);
    const travel = Number(existingClaim.travel || 0);
    const courier = Number(existingClaim.courier || 0);
    const marketing = Number(existingClaim.marketing || 0);
    const totalClaimed = existingClaim.totalClaimed != null
        ? Number(existingClaim.totalClaimed)
        : stallCharges + hotelStay + travel + courier + marketing;
    const savedStallNo = payload.applicantDetails?.stallNo;
    const displayStallNo = savedStallNo && !mongoose.isValidObjectId(String(savedStallNo))
        ? savedStallNo
        : exhibitor.participation?.stallFor || '';

    // Real assigned relationship manager (the admin user who filled/owns this
    // registration), not the exhibitor's own contact — same lookup chain
    // `/api/admin/by-username/:username` uses.
    let relationshipManager = null;
    const rmUsername = exhibitor.filledBy && exhibitor.filledBy !== 'User' ? exhibitor.filledBy.trim() : null;
    if (rmUsername) {
        relationshipManager = await User.findOne({ username: rmUsername })
            .select('username fullName designation department email mobile profileImage')
            .lean();
        if (!relationshipManager) {
            relationshipManager = await User.findOne({ username: { $regex: new RegExp(`^${rmUsername}`, 'i') } })
                .select('username fullName designation department email mobile profileImage')
                .lean();
        }
        if (!relationshipManager) {
            relationshipManager = await User.findOne({ fullName: { $regex: new RegExp(rmUsername, 'i') } })
                .select('username fullName designation department email mobile profileImage')
                .lean();
        }
    }
    const rmName = relationshipManager?.fullName || exhibitor.filledByFullName || (rmUsername || '');
    return {
        ...payload,
        exhibitorName: exhibitor.exhibitorName,
        contact1: contact,
        participation: exhibitor.participation,
        gstNo: exhibitor.gstNo,
        panNo: exhibitor.panNo,
        address: exhibitor.address,
        country: exhibitor.country,
        state: exhibitor.state,
        city: exhibitor.city,
        pincode: exhibitor.pincode,
        kycStatus: exhibitor.kycStatus,
        verificationStatus: exhibitor.verificationStatus,
        amountPaid: exhibitor.amountPaid,
        invoiceValue,
        paymentDate: lastPayment?.paidAt,
        payment: {
            invoiceValue,
            amountPaid: exhibitor.amountPaid,
            paymentStatus: payload.applicantDetails?.paymentStatus,
            paymentDate: lastPayment?.paidAt,
        },
        claim: {
            ...existingClaim,
            stallCharges,
            hotelStay,
            travel,
            courier,
            marketing,
            totalClaimed,
            eligibleAmount: existingClaim.eligibleAmount != null
                ? Number(existingClaim.eligibleAmount)
                : Math.min(totalClaimed, 150000),
        },
        event: {
            name: payload.applicantDetails?.eventName || exhibitor.eventId?.name || exhibitor.eventId?.title,
            startDate: exhibitor.eventId?.startDate,
            endDate: exhibitor.eventId?.endDate,
            stallNumber: displayStallNo,
            hallNumber: payload.applicantDetails?.hallNo || 'Hall 12',
            stallSize: payload.applicantDetails?.stallSize || exhibitor.participation?.stallSize,
            participationType: payload.applicantDetails?.participationType,
            bookingStatus: payload.applicantDetails?.bookingStatus,
            paymentStatus: payload.applicantDetails?.paymentStatus,
        },
        pmsCoordinator: rmName ? {
            name: rmName,
            designation: relationshipManager?.designation || relationshipManager?.department || 'Relationship Manager',
            phone: relationshipManager?.mobile || '',
            email: relationshipManager?.email || '',
            photo: relationshipManager?.profileImage || '',
            initials: rmName.split(/\s+/).filter(Boolean).map(part => part[0]).slice(0, 2).join('').toUpperCase(),
        } : null,
        pmsStageLabels: PMS_STAGE_LABELS,
        pmsClaimDocuments: PMS_CLAIM_DOCUMENT_TYPES.map(type => ({
            type,
            label: DOCUMENT_LABELS[type],
            required: true,
        })),
        // Client (Exhibitor) Contact Details card — editable via the
        // existing PUT /api/exhibitor-registration/:id, not stored here.
        contactDetails: {
            contactPerson: contactName,
            designation: contact.designation || '',
            mobileNumber: contact.mobile || '',
            emailId: contact.email || exhibitor.companyEmail || '',
            landlineNo: exhibitor.landlineNo || '',
            address: [exhibitor.address, exhibitor.city, exhibitor.state, exhibitor.pincode].filter(Boolean).join(', '),
        },
    };
}

async function getOrCreateClaim(exhibitorId) {
    let application = await MsmePmsScheme.findOne({ exhibitorId, applicationType: 'exhibitor_claim' });
    let isNew = false;
    if (!application) {
        application = new MsmePmsScheme({
            exhibitorId,
            applicationType: 'exhibitor_claim',
            applicationId: makeApplicationId(exhibitorId),
            companyName: 'Draft', contactPerson: 'Draft', mobileNumber: 'Draft', emailId: 'draft@invalid.local',
            udyamNumber: 'Draft', category: 'Draft', companyBrief: 'Dashboard application',
            status: 'Draft', currentStep: 1,
            statusHistory: [{ status: 'Draft', changedBy: String(exhibitorId), note: 'Application created' }]
        });
        isNew = true;
    }

    if (application.status !== 'Approved' && application.status !== 'Rejected') {
        const source = await ExhibitorRegistration.findById(exhibitorId).lean();
        if (source) {
            let changed = isNew;
            const addDoc = (docType, url, filename) => {
                if (url && !application.documents.some(d => d.documentType === docType)) {
                    application.documents.push({
                        documentType: docType,
                        filename: filename,
                        path: url,
                        mimetype: 'application/pdf',
                        size: 0
                    });
                    changed = true;
                }
            };
            
            addDoc('udyam', source.msme?.udyamCertificateUrl, 'udyam_certificate.pdf');
            addDoc('gst', source.kycDocuments?.gstCertificate, 'gst_certificate.pdf');
            addDoc('pan', source.kycDocuments?.panCard, 'pan_card.pdf');
            addDoc('aadhaar', source.kycDocuments?.authorizedSignatoryId, 'aadhaar_card.pdf');
            
            if (changed) {
                await application.save();
            }
        }
    } else if (isNew) {
        await application.save();
    }
    
    return application;
}

async function hydrateAdminDraft(application) {
    const currentDetails = application.applicantDetails || {};
    if (Object.keys(currentDetails).length || !application.exhibitorId) return application;
    const source = await ExhibitorRegistration.findById(application.exhibitorId).populate('eventId').lean();
    if (!source) return application;
    const contactName = [source.contact1?.firstName, source.contact1?.lastName].filter(Boolean).join(' ');
    const invoiceValue = Number(source.financeBreakdown?.netPayable || source.totalPayable || source.participation?.total || 0);
    application.applicantDetails = {
        companyName: source.exhibitorName || '',
        udyamRegNo: source.msme?.udyamRegNo || '', gstNumber: source.gstNo || '', panNumber: source.panNo || '',
        organizationType: source.typeOfBusiness || '', yearOfEstablishment: '', msmeCategory: source.msme?.msmeCategory || '',
        contactName, designation: source.contact1?.designation || '', mobileNumber: source.contact1?.mobile || '', alternateNumber: source.contact1?.alternateNo || '',
        addressLine1: source.address || '', addressLine2: '', country: source.country || 'India', state: source.state || '', city: source.city || '', pincode: source.pincode || '',
        eventName: source.eventId?.name || source.eventId?.title || '', stallNo: source.participation?.stallFor || source.participation?.stallNo || '',
        hallNo: 'Hall 12', stallSize: source.participation?.stallSize || '', participationType: source.participation?.stallType || source.participation?.stallCategory || '',
        bookingStatus: source.participation?.stallFor || source.participation?.stallNo ? 'Confirmed' : source.status,
        paymentStatus: invoiceValue > 0 && Number(source.amountPaid || 0) >= invoiceValue ? 'Fully Paid' : Number(source.amountPaid || 0) > 0 ? 'Partially Paid' : 'Pending',
        emailId: source.contact1?.email || source.companyEmail || '',
    };
    application.bankDetails = {
        accountHolderName: source.bankDetails?.accountHolder || source.exhibitorName || '', bankName: source.bankDetails?.bankName || '',
        branchName: source.bankDetails?.branch || '', accountNumber: source.bankDetails?.accountNumber || '', confirmAccountNumber: source.bankDetails?.accountNumber || '',
        ifscCode: source.bankDetails?.ifscCode || '', micrCode: '',
        accountType: source.bankDetails?.accountType === 'Savings' ? 'Savings Account' : source.bankDetails?.accountType === 'Current' ? 'Current Account' : source.bankDetails?.accountType || '',
    };
    application.selectedExpenses = ['Stall Charges'];
    application.companyName = source.exhibitorName || 'Draft'; application.contactPerson = contactName || 'Draft';
    application.mobileNumber = source.contact1?.mobile || 'Draft'; application.emailId = source.contact1?.email || source.companyEmail || 'draft@invalid.local';
    application.udyamNumber = source.msme?.udyamRegNo || 'Draft'; application.category = source.msme?.msmeCategory || 'Draft';
    await application.save();
    return application;
}

class MsmePmsSchemeController {
    async getOrCreateApplicationForAdmin(req, res) {
        try {
            let application = await findApplicationByIdentifier(req.params.id);
            if (!application) {
                const exhibitor = await findExhibitorByIdentifier(req.params.id);
                if (!exhibitor?._id) {
                    return res.status(404).json({ success: false, message: 'Linked exhibitor not found' });
                }
                application = await getOrCreateClaim(exhibitor._id);
                const source = await ExhibitorRegistration.findById(exhibitor._id).populate('eventId').lean();
                if (source && !Object.keys(application.applicantDetails || {}).length) {
                    const contactName = [source.contact1?.firstName, source.contact1?.lastName].filter(Boolean).join(' ');
                    const invoiceValue = Number(source.financeBreakdown?.netPayable || source.totalPayable || source.participation?.total || 0);
                    const paymentStatus = invoiceValue > 0
                        ? (Number(source.amountPaid || 0) >= invoiceValue ? 'Fully Paid' : Number(source.amountPaid || 0) > 0 ? 'Partially Paid' : 'Pending')
                        : 'Pending';
                    application.applicantDetails = {
                        companyName: source.exhibitorName || '',
                        udyamRegNo: source.msme?.udyamRegNo || '',
                        gstNumber: source.gstNo || '',
                        panNumber: source.panNo || '',
                        organizationType: source.typeOfBusiness || '',
                        yearOfEstablishment: '',
                        msmeCategory: source.msme?.msmeCategory || '',
                        contactName,
                        designation: source.contact1?.designation || '',
                        mobileNumber: source.contact1?.mobile || '',
                        alternateNumber: source.contact1?.alternateNo || '',
                        addressLine1: source.address || '',
                        addressLine2: '',
                        country: source.country || 'India',
                        state: source.state || '',
                        city: source.city || '',
                        pincode: source.pincode || '',
                        eventName: source.eventId?.name || source.eventId?.title || '',
                        stallNo: source.participation?.stallFor || '',
                        hallNo: 'Hall 12',
                        stallSize: source.participation?.stallSize || '',
                        participationType: source.participation?.stallType || source.participation?.stallCategory || '',
                        bookingStatus: source.participation?.stallNo || source.participation?.stallFor ? 'Confirmed' : source.status,
                        paymentStatus,
                        emailId: source.contact1?.email || source.companyEmail || '',
                    };
                    application.bankDetails = {
                        accountHolderName: source.bankDetails?.accountHolder || source.exhibitorName || '',
                        bankName: source.bankDetails?.bankName || '',
                        branchName: source.bankDetails?.branch || '',
                        accountNumber: source.bankDetails?.accountNumber || '',
                        confirmAccountNumber: source.bankDetails?.accountNumber || '',
                        ifscCode: source.bankDetails?.ifscCode || '',
                        micrCode: '',
                        accountType: source.bankDetails?.accountType === 'Savings' ? 'Savings Account' : source.bankDetails?.accountType === 'Current' ? 'Current Account' : source.bankDetails?.accountType || '',
                    };
                    application.selectedExpenses = ['Stall Charges'];
                    application.companyName = source.exhibitorName || 'Draft';
                    application.contactPerson = contactName || 'Draft';
                    application.mobileNumber = source.contact1?.mobile || 'Draft';
                    application.emailId = source.contact1?.email || source.companyEmail || 'draft@invalid.local';
                    application.udyamNumber = source.msme?.udyamRegNo || 'Draft';
                    application.category = source.msme?.msmeCategory || 'Draft';
                    await application.save();
                }
            }
            application = await hydrateAdminDraft(application);
            return res.json({ success: true, data: await makeAdminApplicationPayload(application) });
        } catch (error) {
            return res.status(500).json({ success: false, message: 'Could not open PMS application editor', error: error.message });
        }
    }

    async withApplicationOwner(req, res, handler) {
        try {
            const application = await findApplicationByIdentifier(req.params.id);
            if (!application?.exhibitorId) {
                return res.status(404).json({ success: false, message: 'Exhibitor PMS application not found' });
            }
            req.user = { ...(req.user || {}), id: String(application.exhibitorId) };
            return handler.call(this, req, res);
        } catch (error) {
            return res.status(500).json({ success: false, message: 'Could not resolve application', error: error.message });
        }
    }

    async saveApplicationStepById(req, res) {
        return this.withApplicationOwner(req, res, this.saveApplicationStep);
    }

    async uploadApplicationDocumentById(req, res) {
        return this.withApplicationOwner(req, res, this.uploadApplicationDocument);
    }

    async deleteApplicationDocumentById(req, res) {
        return this.withApplicationOwner(req, res, this.deleteApplicationDocument);
    }

    async submitApplicationById(req, res) {
        return this.withApplicationOwner(req, res, this.submitMyApplication);
    }

    async getMyApplication(req, res) {
        try {
            let application = await getOrCreateClaim(req.user.id);
            application = await makeAdminApplicationPayload(application);
            res.json({ success: true, data: application });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Could not load application', error: error.message });
        }
    }

    async saveApplicationStep(req, res) {
        try {
            const step = Number(req.params.step);
            const saveAsDraft = req.body.saveAsDraft === true;
            if (![1, 2, 3, 4].includes(step)) return res.status(400).json({ success: false, message: 'Invalid application step' });
            const application = await getOrCreateClaim(req.user.id);
            if (application.status === 'Approved') return res.status(409).json({ success: false, message: 'Approved applications cannot be edited' });
            if (step > application.currentStep + 1) return res.status(409).json({ success: false, message: 'Complete previous steps first' });

            if (step === 1) {
                const details = req.body.applicantDetails || req.body;
                const missing = missingFields(details, REQUIRED_APPLICANT_FIELDS);
                if (!saveAsDraft && missing.length) return res.status(422).json({ success: false, message: 'Required applicant fields are missing', fields: missing });
                application.applicantDetails = details;
                application.selectedExpenses = Array.isArray(req.body.selectedExpenses) ? req.body.selectedExpenses : application.selectedExpenses;
                if (details.companyName) application.companyName = details.companyName;
                if (details.contactName) application.contactPerson = details.contactName;
                if (details.mobileNumber) application.mobileNumber = details.mobileNumber;
                if (details.emailId) application.emailId = details.emailId;
                if (details.udyamRegNo) application.udyamNumber = details.udyamRegNo;
                if (details.gstNumber) application.gstNumber = details.gstNumber;
                if (details.msmeCategory) application.category = details.msmeCategory;
            } else if (step === 2) {
                const details = req.body.bankDetails || req.body;
                const missing = missingFields(details, REQUIRED_BANK_FIELDS);
                if (!saveAsDraft && missing.length) return res.status(422).json({ success: false, message: 'Required bank fields are missing', fields: missing });
                if (!saveAsDraft && details.confirmAccountNumber && details.confirmAccountNumber !== details.accountNumber) return res.status(422).json({ success: false, message: 'Account numbers do not match', fields: ['confirmAccountNumber'] });
                application.bankDetails = details;
            } else if (step === 3) {
                const uploaded = new Set(application.documents.map(doc => doc.documentType));
                const missing = requiredDocumentsFor(application).filter(type => !uploaded.has(type));
                if (missing.length) return res.status(422).json({ success: false, message: 'Required documents are missing', documentTypes: missing });
            } else {
                application.declarationAgreed = req.body.declarationAgreed === true;
            }
            if (!saveAsDraft) {
                application.completedSteps = [...new Set([...application.completedSteps, step])].sort();
                application.currentStep = Math.max(application.currentStep, Math.min(step + 1, 5));
            }
            await application.save();
            res.json({ success: true, message: saveAsDraft ? 'Draft saved' : 'Step saved', data: application });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Could not save application step', error: error.message });
        }
    }

    async uploadApplicationDocument(req, res) {
        try {
            const { documentType } = req.params;
            if (!DOCUMENT_TYPES.has(documentType)) return res.status(400).json({ success: false, message: 'Invalid document type' });
            if (!req.file) return res.status(400).json({ success: false, message: 'File is required' });
            const application = await getOrCreateClaim(req.user.id);
            if (application.status === 'Approved') return res.status(409).json({ success: false, message: 'Approved applications cannot be edited' });

            // Same AI document-verification service the general Document Center
            // (clientDocumentController.js) already uses, but with an MSME-only
            // prompt override that also extracts the document's real fields
            // (Udyam number, GSTIN, account number, etc.) straight from the file
            // — the general moderation prompt used elsewhere in the app is left
            // untouched. Fails open (skipped) if AI verification isn't
            // configured/enabled, so an unconfigured key never blocks a real
            // submission.
            const documentName = DOCUMENT_LABELS[documentType] || documentType;
            const fileType = (req.file.originalname.split('.').pop() || '').toUpperCase();
            const aiResult = await aiDocumentVerificationService.verifyDocument({
                fileUrl: req.file.path,
                documentName,
                fileType,
                promptOverride: aiDocumentVerificationService.buildMsmeExtractionPrompt(documentType, documentName),
            });
            if (!aiResult.skipped && aiResult.valid === false) {
                await deleteUploadedFile(req.file.path);
                const issueMessages = {
                    nudity: `This file appears to contain inappropriate content and cannot be accepted as "${documentName}".`,
                    minor: `This file cannot be accepted as "${documentName}".`,
                    mismatch: `This file doesn't look like a valid "${documentName}". Please upload the correct document.`,
                    unreadable: `This file is unclear/unreadable. Please upload a clearer copy of "${documentName}".`,
                };
                return res.status(400).json({
                    success: false,
                    message: aiResult.reason || issueMessages[aiResult.issue] || `This document was rejected by AI verification: ${aiResult.issue}`,
                    aiIssue: aiResult.issue,
                });
            }

            application.documents = application.documents.filter(doc => doc.documentType !== documentType);
            application.documents.push({
                documentType,
                filename: req.file.originalname,
                path: req.file.path,
                mimetype: req.file.mimetype,
                size: req.file.size,
                aiVerification: { checked: !aiResult.skipped, reason: aiResult.reason || '' },
                extractedDetails: aiResult.extractedDetails || null,
                uploadedBy: req.user?.fullName || req.user?.username || req.user?.exhibitorName || 'Admin',
            });
            await application.save();
            res.status(201).json({ success: true, message: 'Document uploaded', data: application });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Document upload failed', error: error.message });
        }
    }

    async deleteApplicationDocument(req, res) {
        try {
            const application = await getOrCreateClaim(req.user.id);
            if (application.status === 'Approved') return res.status(409).json({ success: false, message: 'Approved applications cannot be edited' });
            application.documents = application.documents.filter(doc => doc.documentType !== req.params.documentType);
            await application.save();
            res.json({ success: true, message: 'Document removed', data: application });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Could not remove document', error: error.message });
        }
    }

    async submitMyApplication(req, res) {
        try {
            const application = await getOrCreateClaim(req.user.id);
            if (application.submittedAt) return res.status(409).json({ success: false, message: 'Application is already submitted', data: application });
            const missingSteps = [1, 2, 3, 4].filter(step => !application.completedSteps.includes(step));
            const uploaded = new Set(application.documents.map(doc => doc.documentType));
            const missingDocuments = requiredDocumentsFor(application).filter(type => !uploaded.has(type));
            if (missingSteps.length || missingDocuments.length || !application.declarationAgreed) {
                return res.status(422).json({ success: false, message: 'Application is incomplete', missingSteps, missingDocuments });
            }
            application.status = 'Pending';
            application.currentStep = 5;
            application.submittedAt = new Date();
            application.pmsStage = Math.max(application.pmsStage || 1, 2);
            application.statusHistory.push({ status: 'Pending', changedBy: String(req.user.id), note: 'Application submitted' });
            await application.save();
            res.json({ success: true, message: 'Application submitted successfully', data: application });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Could not submit application', error: error.message });
        }
    }
    async submitApplication(req, res) {
        try {
            const {
                companyName,
                contactPerson,
                mobileNumber,
                emailId,
                udyamNumber,
                gstNumber,
                category,
                companyBrief
            } = req.body;

            const documents = req.files ? req.files.map(file => ({
                filename: file.originalname,
                path: file.path,
                mimetype: file.mimetype
            })) : [];

            const newClaim = new MsmePmsScheme({
                companyName,
                contactPerson,
                mobileNumber,
                emailId,
                udyamNumber,
                gstNumber,
                category,
                companyBrief,
                documents
            });

            await newClaim.save();

            res.status(201).json({ success: true, message: 'Application submitted successfully', data: newClaim });
        } catch (error) {
            console.error('Error saving public PMS claim:', error);
            res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
        }
    }

    async getAllApplications(req, res) {
        try {
            const applications = await MsmePmsScheme.find({ is_lead: false }).sort({ createdAt: -1 });
            res.status(200).json({ success: true, data: applications });
        } catch (error) {
            console.error('Error fetching MSME PMS applications:', error);
            res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
        }
    }

    // Used from Book a Stand (admin) when Stall Category = "Under MSME PSM
    // Scheme": no ExhibitorRegistration exists yet at that point, so this
    // just verifies + extracts from the certificate and hands the result
    // back for the admin form to hold onto and submit with the booking —
    // nothing is persisted here.
    async verifyUdyamCertificateStandalone(req, res) {
        try {
            if (!req.file) return res.status(400).json({ success: false, message: 'File is required' });

            const documentName = DOCUMENT_LABELS.udyam;
            const fileType = (req.file.originalname.split('.').pop() || '').toUpperCase();
            const { industrySector, companyBrief, typeOfBusiness } = req.body;
            const aiResult = await aiDocumentVerificationService.verifyDocument({
                fileUrl: req.file.path,
                documentName,
                fileType,
                promptOverride: aiDocumentVerificationService.buildMsmeEligibilityScreeningPrompt(documentName, {
                    industrySector,
                    companyBrief,
                    typeOfBusiness,
                    validCategories: INDUSTRY_SECTOR_OPTIONS,
                }),
            });

            if (!aiResult.skipped && aiResult.valid === false) {
                await deleteUploadedFile(req.file.path);
                const issueMessages = {
                    nudity: `This file cannot be accepted as "${documentName}".`,
                    minor: `This file cannot be accepted as "${documentName}".`,
                    mismatch: `This file doesn't look like a valid "${documentName}". Please upload the correct document.`,
                    unreadable: `This file is unclear/unreadable. Please upload a clearer copy of "${documentName}".`,
                };
                return res.status(400).json({
                    success: false,
                    message: aiResult.reason || issueMessages[aiResult.issue] || `This document was rejected by AI verification: ${aiResult.issue}`,
                    aiIssue: aiResult.issue,
                });
            }

            const details = aiResult.extractedDetails || {};
            const udyamRegNo = details['Udyam Registration Number'] || null;
            const enterpriseName = details['Enterprise Name'] || null;
            const category = details['Type of Enterprise (Micro/Small/Medium)'] || null;
            const registrationDate = details['Date of Registration'] || null;
            const majorActivity = details['Major Activity (Manufacturing/Service/Trading)'] || null;

            // Eligibility for the MSME PMS scheme, checkable purely from what's
            // on the certificate itself — a genuine, readable Udyam certificate
            // with its core identifying fields present. When AI verification
            // isn't configured, this stays "unknown" rather than blocking the
            // booking on an unavailable check.
            let eligible = null;
            const eligibilityReasons = [];
            if (aiResult.skipped) {
                eligibilityReasons.push('AI verification is not available right now — please confirm the certificate details manually.');
            } else {
                if (!udyamRegNo) eligibilityReasons.push('Udyam Registration Number could not be read from the certificate.');
                if (!enterpriseName) eligibilityReasons.push('Enterprise Name could not be read from the certificate.');
                if (!category) eligibilityReasons.push('MSME category (Micro/Small/Medium) could not be read from the certificate.');
                eligible = eligibilityReasons.length === 0;
            }

            res.json({
                success: true,
                data: {
                    fileUrl: req.file.path,
                    aiChecked: !aiResult.skipped,
                    aiReason: aiResult.reason || '',
                    extractedDetails: details,
                    udyamRegNo,
                    enterpriseName,
                    category,
                    registrationDate,
                    majorActivity,
                    eligible,
                    eligibilityReasons,
                    screening: aiResult.screening || null,
                },
            });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Udyam certificate verification failed', error: error.message });
        }
    }

    async getApplicationById(req, res) {
        try {
            const application = await findApplicationByIdentifier(req.params.id);
            if (!application) {
                return res.status(404).json({ success: false, message: 'Application not found' });
            }
            res.status(200).json({ success: true, data: await makeAdminApplicationPayload(application) });
        } catch (error) {
            console.error('Error fetching MSME PMS application by ID:', error);
            res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
        }
    }

    async updateApplicationStatus(req, res) {
        try {
            const { status, is_lead, reason } = req.body;
            const application = await MsmePmsScheme.findById(req.params.id);
            if (!application) {
                return res.status(404).json({ success: false, message: 'Application not found' });
            }
            if (status !== undefined) {
                application.status = status;
                application.statusHistory.push({
                    status,
                    note: reason || '',
                    changedBy: req.user?.fullName || req.user?.username || 'Admin',
                });
            }
            if (is_lead !== undefined) application.is_lead = is_lead;
            await application.save();
            res.status(200).json({ success: true, message: 'Status updated successfully', data: application });
        } catch (error) {
            console.error('Error updating MSME PMS application status:', error);
            res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
        }
    }

    async updatePmsStage(req, res) {
        try {
            const stage = Number(req.body.stage);
            if (!Number.isInteger(stage) || stage < 1 || stage > 3) {
                return res.status(400).json({ success: false, message: 'Stage must be a number between 1 and 3' });
            }
            const application = await MsmePmsScheme.findById(req.params.id);
            if (!application) return res.status(404).json({ success: false, message: 'Application not found' });
            application.pmsStage = stage;
            application.statusHistory.push({
                status: application.status,
                note: `Stage moved to "${PMS_STAGE_LABELS[stage - 1]}"`,
                changedBy: req.user?.fullName || req.user?.username || 'Admin',
            });
            await application.save();
            res.json({ success: true, message: 'Stage updated', data: await makeAdminApplicationPayload(application) });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Could not update stage', error: error.message });
        }
    }

    async updateMsmePortal(req, res) {
        try {
            const application = await MsmePmsScheme.findById(req.params.id);
            if (!application) return res.status(404).json({ success: false, message: 'Application not found' });
            const { applicationNo, currentStatus, remarks, submittedOn, submittedBy, submittedByRole } = req.body;
            const existing = application.msmePortal || {};
            application.msmePortal = {
                applicationNo: applicationNo ?? existing.applicationNo ?? '',
                submittedOn: submittedOn ?? existing.submittedOn ?? (applicationNo ? new Date() : undefined),
                submittedBy: submittedBy ?? existing.submittedBy ?? req.user?.fullName ?? req.user?.username ?? 'Admin',
                submittedByRole: submittedByRole ?? existing.submittedByRole ?? req.user?.designation ?? '',
                currentStatus: currentStatus ?? existing.currentStatus ?? '',
                lastStatusChecked: new Date(),
                acknowledgementFile: existing.acknowledgementFile || '',
                acknowledgementFileName: existing.acknowledgementFileName || '',
                acknowledgementFileSize: existing.acknowledgementFileSize || 0,
                remarks: remarks ?? existing.remarks ?? '',
            };
            application.statusHistory.push({
                status: application.status,
                note: `MSME Portal status updated${currentStatus ? `: ${currentStatus}` : ''}`,
                changedBy: req.user?.fullName || req.user?.username || 'Admin',
            });
            await application.save();
            res.json({ success: true, message: 'Portal status saved', data: await makeAdminApplicationPayload(application) });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Could not save portal status', error: error.message });
        }
    }

    async uploadPortalAcknowledgement(req, res) {
        try {
            if (!req.file) return res.status(400).json({ success: false, message: 'File is required' });
            const application = await MsmePmsScheme.findById(req.params.id);
            if (!application) return res.status(404).json({ success: false, message: 'Application not found' });
            if (application.msmePortal?.acknowledgementFile) {
                await deleteUploadedFile(application.msmePortal.acknowledgementFile);
            }
            application.msmePortal = {
                ...(application.msmePortal?.toObject ? application.msmePortal.toObject() : application.msmePortal || {}),
                acknowledgementFile: req.file.path,
                acknowledgementFileName: req.file.originalname,
                acknowledgementFileSize: req.file.size,
            };
            await application.save();
            res.status(201).json({ success: true, message: 'Acknowledgement uploaded', data: await makeAdminApplicationPayload(application) });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Could not upload acknowledgement', error: error.message });
        }
    }

    async setActionRequired(req, res) {
        try {
            const application = await MsmePmsScheme.findById(req.params.id);
            if (!application) return res.status(404).json({ success: false, message: 'Application not found' });
            const { resolved } = req.body;
            if (resolved) {
                application.actionRequired = { resolved: true };
            } else {
                const { message, dueDate } = req.body;
                if (!message) return res.status(400).json({ success: false, message: 'A message describing what is needed is required' });
                application.actionRequired = { message, dueDate: dueDate || undefined, resolved: false, createdAt: new Date() };
            }
            application.statusHistory.push({
                status: application.status,
                note: resolved ? 'Action-required query resolved' : `Action required: ${req.body.message}`,
                changedBy: req.user?.fullName || req.user?.username || 'Admin',
            });
            await application.save();
            res.json({ success: true, message: 'Saved', data: await makeAdminApplicationPayload(application) });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Could not update action-required status', error: error.message });
        }
    }

    async updateDocumentStatus(req, res) {
        try {
            const application = await MsmePmsScheme.findById(req.params.id);
            if (!application) return res.status(404).json({ success: false, message: 'Application not found' });
            const doc = application.documents.id(req.params.documentId);
            if (!doc) return res.status(404).json({ success: false, message: 'Document not found' });
            const { status, portalStatus, uploadedOnPortal } = req.body;
            if (status !== undefined) {
                if (!['Submitted', 'Verified', 'Rejected'].includes(status)) {
                    return res.status(400).json({ success: false, message: 'Invalid document status' });
                }
                doc.status = status;
            }
            if (portalStatus !== undefined) {
                if (!['', 'Accepted', 'Pending', 'Rejected'].includes(portalStatus)) {
                    return res.status(400).json({ success: false, message: 'Invalid portal status' });
                }
                doc.portalStatus = portalStatus;
                if (portalStatus && !doc.uploadedOnPortal) doc.uploadedOnPortal = new Date();
            }
            if (uploadedOnPortal !== undefined) doc.uploadedOnPortal = uploadedOnPortal || undefined;
            await application.save();
            res.json({ success: true, message: 'Document status updated', data: await makeAdminApplicationPayload(application) });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Could not update document status', error: error.message });
        }
    }

    // A document type marked Not Applicable applies to THIS exhibitor's
    // claim only (e.g. Category Certificate for a General-category
    // applicant) — it's a decision on the claim, not a global document-type
    // setting, so it's stored as a placeholder documents[] entry.
    async markDocumentNotApplicable(req, res) {
        try {
            const application = await MsmePmsScheme.findById(req.params.id);
            if (!application) return res.status(404).json({ success: false, message: 'Application not found' });
            const { documentType } = req.params;
            if (!DOCUMENT_TYPES.has(documentType)) return res.status(400).json({ success: false, message: 'Invalid document type' });
            const { notApplicable } = req.body;
            let doc = application.documents.find(d => d.documentType === documentType);
            if (notApplicable) {
                if (doc?.path) return res.status(409).json({ success: false, message: 'A file is already uploaded for this document — remove it first.' });
                if (!doc) {
                    application.documents.push({ documentType, notApplicable: true });
                } else {
                    doc.notApplicable = true;
                }
            } else if (doc && !doc.path) {
                application.documents = application.documents.filter(d => d !== doc);
            } else if (doc) {
                doc.notApplicable = false;
            }
            await application.save();
            res.json({ success: true, message: 'Saved', data: await makeAdminApplicationPayload(application) });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Could not update document', error: error.message });
        }
    }

    async updateUdyamDetails(req, res) {
        try {
            const application = await MsmePmsScheme.findById(req.params.id);
            if (!application) return res.status(404).json({ success: false, message: 'Application not found' });
            const { registrationType, enterpriseType, majorActivity, socialCategory, constitution, dateOfIncorporation } = req.body;
            const existing = application.udyamDetails || {};
            application.udyamDetails = {
                registrationType: registrationType ?? existing.registrationType ?? '',
                enterpriseType: enterpriseType ?? existing.enterpriseType ?? '',
                majorActivity: majorActivity ?? existing.majorActivity ?? '',
                socialCategory: socialCategory ?? existing.socialCategory ?? '',
                constitution: constitution ?? existing.constitution ?? '',
                dateOfIncorporation: dateOfIncorporation ?? existing.dateOfIncorporation,
            };
            await application.save();
            res.json({ success: true, message: 'Udyam details saved', data: await makeAdminApplicationPayload(application) });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Could not save Udyam details', error: error.message });
        }
    }

    async updatePortalOtpContact(req, res) {
        try {
            const application = await MsmePmsScheme.findById(req.params.id);
            if (!application) return res.status(404).json({ success: false, message: 'Application not found' });
            const { contactPerson, mobile, mobileVerified, email, emailVerified } = req.body;
            const existing = application.portalOtpContact || {};
            application.portalOtpContact = {
                contactPerson: contactPerson ?? existing.contactPerson ?? '',
                mobile: mobile ?? existing.mobile ?? '',
                mobileVerified: mobileVerified ?? existing.mobileVerified ?? false,
                email: email ?? existing.email ?? '',
                emailVerified: emailVerified ?? existing.emailVerified ?? false,
            };
            await application.save();
            res.json({ success: true, message: 'Portal OTP contact saved', data: await makeAdminApplicationPayload(application) });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Could not save portal OTP contact', error: error.message });
        }
    }

    // Runs the same AI eligibility-screening prompt used on Book a Stand
    // (buildMsmeEligibilityScreeningPrompt), but against this claim's already
    // -uploaded Udyam certificate + its own applicant details, and persists
    // the result so admins don't need to re-run it on every page load.
    async runAiScreening(req, res) {
        try {
            const application = await MsmePmsScheme.findById(req.params.id);
            if (!application) return res.status(404).json({ success: false, message: 'Application not found' });
            const udyamDoc = application.documents.find(d => d.documentType === 'udyam' && d.path);
            if (!udyamDoc) return res.status(400).json({ success: false, message: 'Upload the Udyam Registration Certificate before running AI screening.' });

            const applicant = application.applicantDetails || {};
            // industrySector/companyBrief live on the exhibitor's own
            // registration, not applicantDetails — applicantDetails.
            // participationType is the stall construction type (e.g. "Shell
            // Space"), not an industry, so it must never be used as a
            // fallback here.
            const exhibitorSource = application.exhibitorId
                ? await ExhibitorRegistration.findById(application.exhibitorId).select('industrySector aboutCompany typeOfBusiness').lean()
                : null;
            const documentName = DOCUMENT_LABELS.udyam;
            const fileType = (udyamDoc.filename?.split('.').pop() || 'pdf').toUpperCase();
            const aiResult = await aiDocumentVerificationService.verifyDocument({
                fileUrl: udyamDoc.path,
                documentName,
                fileType,
                promptOverride: aiDocumentVerificationService.buildMsmeEligibilityScreeningPrompt(documentName, {
                    industrySector: applicant.industrySector || exhibitorSource?.industrySector,
                    companyBrief: applicant.companyBrief || applicant.aboutCompany || exhibitorSource?.aboutCompany,
                    typeOfBusiness: applicant.organizationType || exhibitorSource?.typeOfBusiness,
                    validCategories: INDUSTRY_SECTOR_OPTIONS,
                }),
            });

            if (aiResult.skipped) {
                return res.status(422).json({ success: false, message: 'AI verification is not available right now — please configure/enable it in AI Verification Settings.' });
            }
            const screening = aiResult.screening || {};
            const comments = [];
            if (screening.categoryMatch) comments.push('Business activities match with approved PMS scheme activities and event category.');
            if (screening.riskLevel === 'Low') comments.push('Low risk — subject to MSME-DFO verification and actual exhibited products.');
            if (screening.recommendation === 'PROCEED_WITH_PMS_APPLICATION') comments.push('Recommended to proceed with PMS application on MSME portal.');
            if (screening.riskNote) comments.push(screening.riskNote);

            application.aiScreening = {
                pmsEligible: screening.recommendation === 'PROCEED_WITH_PMS_APPLICATION',
                categoryMatch: screening.categoryMatch ?? null,
                bestMatchingCategory: screening.bestMatchingCategory || '',
                nicCodeMatch: screening.nicCodeMatch || '',
                riskLevel: screening.riskLevel || '',
                recommendation: screening.recommendation || '',
                comments,
                screenedAt: new Date(),
            };
            await application.save();
            res.json({ success: true, message: 'AI screening complete', data: await makeAdminApplicationPayload(application) });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Could not run AI screening', error: error.message });
        }
    }

    async deleteApplication(req, res) {
        try {
            const deleted = await MsmePmsScheme.findByIdAndDelete(req.params.id);
            if (!deleted) {
                return res.status(404).json({ success: false, message: 'Application not found' });
            }
            res.status(200).json({ success: true, message: 'Application deleted successfully' });
        } catch (error) {
            console.error('Error deleting MSME PMS application:', error);
            res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
        }
    }

    async getPageContent(req, res) {
        try {
            let page = await MsmePmsPage.findOne();
            if (!page) {
                page = new MsmePmsPage({
                    stats: [
                        { img: "/msmepmsscheme/global.png", val: "1,000+", label: "GLOBAL BUYERS" },
                        { img: "/msmepmsscheme/exhibitors.png", val: "150+", label: "EXHIBITORS" },
                        { img: "/msmepmsscheme/visitors.png", val: "8,000+", label: "VISITORS/ DELEGATES" },
                        { img: "/msmepmsscheme/conference.png", val: "18+", label: "CONFERENCE SESSIONS" },
                        { img: "/msmepmsscheme/businessOpportunities.png", val: "3 DAYS", label: "OF BUSINESS OPPORTUNITIES" },
                        { img: "/msmepmsscheme/networkevents.png", val: "MULTIPLE", label: "NETWORKING EVENTS" },
                    ],
                    footerStats: [
                        { img: "/msmepmsscheme/global1.png", val: "1,000+", label: "GLOBAL BUYERS" },
                        { img: "/msmepmsscheme/exhibitors.png", val: "150+", label: "EXHIBITORS" },
                        { img: "/msmepmsscheme/visitors.png", val: "8,000+", label: "VISITORS/ DELEGATES" },
                        { img: "/msmepmsscheme/conference.png", val: "18+", label: "CONFERENCE SESSIONS" },
                        { img: "/msmepmsscheme/businessOpportunities1.png", val: "3 DAYS", label: "OF BUSINESS OPPORTUNITIES" },
                    ],
                    benefits: [
                        { img: "/msmepmsscheme/reimbursement.png", title: "Up to ₹1.5 Lakh* Reimbursement", desc: "Subsidy on stall booking & participation cost" },
                        { img: "/msmepmsscheme/reducedCost.png", title: "Reduced Cost", desc: "Lower financial burden for market expansion" },
                        { img: "/msmepmsscheme/marketexposure.png", title: "Market Exposure", desc: "Showcase your products to national & international buyers" },
                        { img: "/msmepmsscheme/businessgrowth.png", title: "Business Growth", desc: "Generate leads & expand your network" },
                        { img: "/msmepmsscheme/govsupport.png", title: "Government Support", desc: "Exhibit with the backing of Ministry of MSME" },
                        { img: "/msmepmsscheme/brandvisibility.png", title: "Brand Visibility", desc: "Enhance brand credibility and recognition" },
                    ]
                });
                await page.save();
            }
            res.status(200).json({ success: true, data: page });
        } catch (error) {
            console.error('Error fetching MSME PMS Page content:', error);
            res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
        }
    }

    async updatePageContent(req, res) {
        try {
            let page = await MsmePmsPage.findOne();
            if (!page) {
                page = new MsmePmsPage(req.body);
            } else {
                Object.assign(page, req.body);
            }
            await page.save();
            res.status(200).json({ success: true, message: 'Page content updated successfully', data: page });
        } catch (error) {
            console.error('Error updating MSME PMS Page content:', error);
            res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
        }
    }
}

module.exports = new MsmePmsSchemeController();
