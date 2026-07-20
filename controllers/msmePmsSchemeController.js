const MsmePmsScheme = require('../models/MsmePmsScheme');
const MsmePmsPage = require('../models/MsmePmsPage');
const ExhibitorRegistration = require('../models/ExhibitorRegistration');
const Company = require('../models/Company');
const mongoose = require('mongoose');

const REQUIRED_DOCUMENTS = ['udyam', 'gst', 'pan', 'aadhaar', 'cheque', 'statement'];
const DOCUMENT_TYPES = new Set([...REQUIRED_DOCUMENTS, 'passbook', 'hotelInvoice', 'hotelPayment', 'travelExpense', 'travelInvoice', 'courier', 'marketing']);
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
            stallNumber: displayStallNo,
            hallNumber: payload.applicantDetails?.hallNo || 'Hall 8, 9 & 10',
            stallSize: payload.applicantDetails?.stallSize || exhibitor.participation?.stallSize,
            participationType: payload.applicantDetails?.participationType,
            bookingStatus: payload.applicantDetails?.bookingStatus,
            paymentStatus: payload.applicantDetails?.paymentStatus,
        },
        pmsCoordinator: {
            name: contactName,
            designation: contact.designation,
            phone: contact.mobile,
            whatsapp: contact.whatsapp || contact.mobile,
            email: contact.email,
            photo: contact.photoUrl,
            initials: contactName.split(/\s+/).filter(Boolean).map(part => part[0]).join('').slice(0, 2).toUpperCase(),
        },
    };
}

async function getOrCreateClaim(exhibitorId) {
    let application = await MsmePmsScheme.findOne({ exhibitorId, applicationType: 'exhibitor_claim' });
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
        hallNo: 'Hall 8, 9 & 10', stallSize: source.participation?.stallSize || '', participationType: source.participation?.stallType || source.participation?.stallCategory || '',
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
                        hallNo: 'Hall 8, 9 & 10',
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
            const application = await getOrCreateClaim(req.user.id);
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
            application.documents = application.documents.filter(doc => doc.documentType !== documentType);
            application.documents.push({ documentType, filename: req.file.originalname, path: req.file.path, mimetype: req.file.mimetype, size: req.file.size });
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
            const { status, is_lead } = req.body;
            const updateFields = {};
            if (status !== undefined) updateFields.status = status;
            if (is_lead !== undefined) updateFields.is_lead = is_lead;

            const updatedApplication = await MsmePmsScheme.findByIdAndUpdate(
                req.params.id,
                updateFields,
                { returnDocument: 'after' }
            );
            if (!updatedApplication) {
                return res.status(404).json({ success: false, message: 'Application not found' });
            }
            res.status(200).json({ success: true, message: 'Status updated successfully', data: updatedApplication });
        } catch (error) {
            console.error('Error updating MSME PMS application status:', error);
            res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
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
